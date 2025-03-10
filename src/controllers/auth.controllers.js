import { base_url, client_id, client_secret, redirect_url } from "../constants.js";
import { User } from "../models/user.models.js";
import axios from "axios";
import qs from "qs";

export async function updateHubSpotTokens(owner) {
	try {
		// Refresh the access token
		const data = {
			grant_type: "refresh_token",
			client_id: client_id,
			client_secret: client_secret,
			refresh_token: owner.integrationTokens.hubspot.refresh_token,
		};

		const headers = {
			"Content-Type": "application/x-www-form-urlencoded",
		};

		const url = `${base_url}/oauth/v1/token`;
		const response = await axios.post(url, qs.stringify(data), { headers });
		const { refresh_token, access_token, expires_in } = response.data;

		let expiry = new Date(
			new Date().getTime() + expires_in
		);

		// Find the user by their number and update the HubSpot tokens
		const updatedUser = await User.findOneAndUpdate(
			{ number: owner.number },
			{
				$set: {
					"integrationTokens.hubspot.access_token": access_token,
					"integrationTokens.hubspot.refresh_token": refresh_token,
					"integrationTokens.hubspot.expires_in": expiry, 
				},
			},
			{ new: true }
		);

		if (updatedUser) {
			console.log("HubSpot tokens updated successfully:");
			return response.data;
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

		const data = encodeURIComponent(JSON.stringify({ number, clientUrl }));

		let owner = await User.findOne({ number });
		console.log("User", owner);

		// IF User does not exist create one
		if (!owner) {
			let authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_url}/hubspot/auth&scope=oauth%20crm.objects.companies.read%20crm.objects.companies.write%20crm.objects.contacts.read%20crm.objects.contacts.write%20crm.objects.deals.read%20crm.objects.deals.write%20crm.objects.users.read%20crm.objects.users.write%20crm.objects.owners.read%20tickets&state=${data}`;

			return res.status(201).json({
				success: true,
				message: "Please verify yourself with given link",
				url: authUrl,
			});
		} else {
			await updateHubSpotTokens(owner);

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
	let state = JSON.parse(decodeURIComponent(req.query.state));
	let number = state.number;
	let clntUrl = state.clientUrl;

	console.log("Creating new User");

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

			console.log("NewUser", newUser);

			const query = new URLSearchParams({
				authenticated: true,
			}).toString();

			return res.redirect(`${clntUrl}?${query}`);
		}
	} catch (error) {
		if (error.response) {
			console.log("Error response data: ", error.response.data);
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
