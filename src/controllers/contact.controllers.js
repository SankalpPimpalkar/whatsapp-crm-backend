import axios from "axios";
import qs from "qs";
import { access_token, base_url, client_id, client_secret } from "../constants.js";
import { User } from "../models/user.models.js";
import { updateHubSpotTokens } from "./auth.controllers.js";

async function createContactInHubspot(contactDetails, accessToken) {
	const contactProperties = {
		properties: {
			firstname: contactDetails.firstname,
			lastname: contactDetails.lastname,
			email: contactDetails.email,
			phone: contactDetails.number || "",
			company: contactDetails.company || "", 
			jobtitle: contactDetails.jobtitle || "", 
			hubspot_owner_id: contactDetails.ownerId,
			lifecyclestage: contactDetails.lifecyclestage,
			hs_lead_status: contactDetails.leadStatus,
		},
	};

	try {
		const url = `${base_url}/crm/v3/objects/contacts`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`, // Use refreshed token
		};

		console.log("Creating contact in HubSpot");

		const response = await axios.post(url, contactProperties, { headers });
		console.log("Response", response);
		return response.data;
	} catch (error) {
		console.log("Error in creating contact", error.message);
		throw new Error(`Failed to create contact: ${error.message}`);
	}
}


export async function createContact(req, res) {
	try {
		console.log("Creating new contact");
		const { number, contactDetails } = req.body;

		const owner = await User.findOne({ number });

		if (!owner) {
			return res.status(404).json({
				success: false,
				message: "Owner not registered with this number",
			});
		}

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

		// Update tokens in DB
		await updateHubSpotTokens(owner.number, access_token, refresh_token, expires_in);

		// Pass the new token to create the contact
		const newContact = await createContactInHubspot(contactDetails, access_token);

		return res.status(200).json({
			success: true,
			message: "New contact created",
			data: newContact,
		});
	} catch (error) {
		console.log("Error while creating a new contact: ", error.message);
		return res.status(500).json({
			success: false,
			message: "Error while creating a new contact",
			error: error.message,
		});
	}
}
