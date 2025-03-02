import { client_id, client_secret, redirect_url } from "../constants.js";
import { User } from "../models/user.models.js";
import axios from "axios";
import qs from "qs";

async function updateHubSpotTokens(
	userNumber,
	accessToken,
	refreshToken,
	expiresIn
) {
	try {
		// Find the user by their number and update the HubSpot tokens
		const updatedUser = await User.findOneAndUpdate(
			{ number: userNumber }, // Find user by number
			{
				$set: {
					"integrationTokens.hubspot.access_token": accessToken, // Update access token
					"integrationTokens.hubspot.refresh_token": refreshToken, // Update refresh token
					"integrationTokens.hubspot.expires_in": expiresIn, // Update expiry time
				},
			}
		);

		if (updatedUser) {
			console.log("HubSpot tokens updated successfully:");
			return;
		} else {
			console.log("User not found");
			throw "User not found";
		}
	} catch (error) {
		console.error("Error updating HubSpot tokens:", error);
		throw "Error updating HubSpot tokens";
	}
}

export async function authenticateUser(req, res) {
	try {
		console.log("Authenticating");
		const { number, clientUrl } = req.body;
		let stateData = JSON.stringify({
			number,
			clientUrl,
		});

		let user = await User.findOne({ number });
		console.log("User", user)

		// IF User does not exist create one
		if (!user) {
			let authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_url}/hubspot/auth&scope=oauth crm.objects.companies.read crm.objects.companies.write crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write crm.objects.users.read crm.objects.users.write crm.objects.owners.read tickets&state=${stateData}`;

			return res.status(201).json({
				success: true,
				message: "New user created",
				url: authUrl,
			});
		} else {
			let { acces_token, refresh_token } = user.integrationTokens.hubspot;
			const data = {
				grant_type: "refresh_token",
				client_id: client_id,
				client_secret: client_secret,
				refresh_token: refresh_token,
			};
			const url = "https://api.hubapi.com/oauth/v1/token";
			const headers = {
				"Content-Type": "application/x-www-form-urlencoded",
			};

			const response = await axios.post(url, qs.stringify(data), {
				headers,
			});

			if (!response.data) {
				throw "Error while authenticating user";
			}

			const responseData = response.data;

			let expiry = new Date(
				new Date().getTime() + responseData.expires_in
			);

			await updateHubSpotTokens(
				number,
				acces_token,
				refresh_token,
				expiry
			);
			return res.status(200).json({
				success: true,
				message: "User authenticated",
				authenticated: true,
			});
		}
	} catch (error) {
		console.log("Error while authenticating user: ", error.message);
		return res.status(500).json({
			success: false,
			message: "Error while authenticating user",
			error: error.message,
		});
	}
}

export async function createUser(req, res) {
	let code = req.query.code;
	let state = JSON.parse(req.query.state);
	let number = state.number;
	let clntUrl = state.clientUrl;

	try {
		if (code) {
			const data = {
				grant_type: "authorization_code",
				client_id: client_id,
				client_secret: client_secret,
				redirect_uri: `${redirect_url}/hubspot/auth`,
				code: code,
			};

			const url = "https://api.hubapi.com/oauth/v1/token";
			const headers = {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded",
			};
			const response = await axios.post(url, qs.stringify(data), {
				headers,
				maxBodyLength: Infinity,
			});

			console.log("Response", response);

			const currentDate = new Date();
			const expiry = new Date(
				currentDate.getTime() + response.data.expires_in
			);

			let newUser = new User({
				number: number,
				integrationTokens: {
					hubspot: {
						acces_token: response.data.access_token,
						refresh_token: response.data.refresh_token,
						expires_in: expiry,
					},
				},
			});
			await newUser.save();

			console.log("NewUser", newUser)

			const query = new URLSearchParams({
				authenticated: true,
			}).toString();
			return res.redirect(`${clntUrl}?${query}`);
		}
	} catch (error) {
		if (error.response) {
			console.log("Error response data: ", error.response.data);
			// console.log("Error response status: ", error.response.status);
			// console.log("Error response headers: ", error.response.headers);
		} else {
			console.log("Error message: ", error.message);
		}
		return res.status(500).json({
			success: false,
			authenticated: false,
			message: "Error occurred while authenticating user",
			error: error.message,
		});
	}
}
