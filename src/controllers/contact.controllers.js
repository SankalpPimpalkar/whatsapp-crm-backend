import axios from "axios";
import qs from "qs";
import { access_token, base_url } from "../constants.js";
import { User } from "../models/user.models.js";
import { updateHubSpotTokens } from "./auth.controllers.js";

async function createContactInHubspot(contactDetails) {

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
			"Authorization": `Bearer ${access_token}`,
		};

		const response = await axios.post(url, contactProperties, { headers });
		return response.data;

	} catch (error) {
		console.log("Error in creating contact", error.message);
		throw new Error("Failed to create contact: ", error.message);
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

		const data = {
			grant_type: "refresh_token",
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			refresh_token: owner.integrationTokens.hubspot.refresh_token,
		};

		const headers = {
			"Content-Type": "application/x-www-form-urlencoded",
		};

		const url = `${base_url}/oauth/v1/token`;
		const response = await axios.post(url, qs.stringify(data), { headers });
		const { token, expires_in } = response.data;

		console.log("Refreshed tokens", response.data);

		await updateHubSpotTokens(
			owner.number,
			owner.integrationTokens.hubspot.acces_token,
			token,
			expires_in
		);

        const newContact = await createContactInHubspot(contactDetails)

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
