import axios from "axios";
import { base_url, client_id, client_secret } from "../constants.js";
import { User } from "../models/user.models.js";
import qs from "qs";

export default async function updateHubSpotTokens(owner) {
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

		let expiry = new Date(new Date().getTime() + expires_in);

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
