import axios from "axios";
import qs from "qs";
import { User as Owner } from "../models/user.models";
const { getURLs } = require("../../constants/whitelabel");
const {
	getWhiteLabelOwnerOfBoloUser,
} = require("../../controller/controllerHelpers");

// Helper function to update OAuth tokens in the database
const updateOAuthToken = async (email, tokens) => {
	try {
		const { access_token, refresh_token } = tokens;
		await Owner.updateOne(
			{ email },
			{
				$set: {
					"integrationTokens.hubspot": {
						access_token,
						refresh_token,
					},
				},
			},
			{ useFindAndModify: false }
		);
		console.log("Updated HubSpot tokens for user:", email);
	} catch (error) {
		console.error(
			`[route: auth] Error updating OAuth tokens for HubSpot: ${error.message}`
		);
		throw error; // Re-throw the error for handling upstream
	}
};

// Helper function to exchange authorization code for tokens
const exchangeCodeForTokens = async (code) => {
	try {
		const data = {
			grant_type: "authorization_code",
			client_id: process.env.HUBSPOT_CLIENT_ID,
			client_secret: process.env.HUBSPOT_CLIENT_SECRET,
			redirect_uri: `${process.env.BASE_URL}/api/v1/signature/auth/hubspot/callback`,
			code,
		};

		const headers = {
			Accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
		};

		const url = "https://api.hubapi.com/oauth/v1/token";
		const response = await axios.post(url, qs.stringify(data), {
			headers,
			maxBodyLength: Infinity,
		});

		return response.data;
	} catch (error) {
		console.error(
			"Error exchanging authorization code for tokens:",
			error.message
		);
		throw error; // Re-throw the error for handling upstream
	}
};

// Main controller for handling HubSpot OAuth callback
export const handleHubSpotCallback = async (req) => {
	let _redirectUrl = "/";
	let urls;

	try {
		const { code, error, state } = req.query;

		// Validate state parameter
		if (!state) {
			throw new Error("State parameter is missing.");
		}

		const [redirectUrl, email] = state.split(";");

		// Fetch owner and white-label information
		const owner = await Owner.findOne({ email });
		if (!owner) {
			throw new Error(`Owner not found for email: ${email}`);
		}

		const whiteData = await getWhiteLabelOwnerOfBoloUser({
			filter: { email: owner.email },
		});
		urls = getURLs({ whiteOwner: whiteData?.whiteLabelInfo });

		// Update redirect URL if provided in state
		if (redirectUrl) {
			_redirectUrl = redirectUrl;
		}

		// Handle user denial
		if (error) {
			console.log("User denied access:", req.query.error_description);
			return { redirectUrl: `${urls.FRONTEND_URL}${_redirectUrl}` };
		}

		// Exchange authorization code for tokens
		if (code) {
			const tokens = await exchangeCodeForTokens(code);
			await updateOAuthToken(email, tokens);
			console.log("Successfully updated HubSpot tokens.");
		}

		return { redirectUrl: `${urls.FRONTEND_URL}${_redirectUrl}` };
	} catch (error) {
		console.error("Error in HubSpot OAuth callback:", error.message);
		throw error; // Re-throw the error for handling upstream
	}
};
