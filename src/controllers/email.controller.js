import axios from "axios";
import { base_url } from "../constants.js";
import { User } from "../models/user.models.js";
import updateHubSpotTokens from "../utils/updateTokens.js";
import getContacts from "../utils/getContacts.js";
import getOwner from "../utils/getOwner.js";

export async function createContactEmail(req, res) {
	try {
		const { number, subject, body, toEmail } = req.body;

		const owner = await User.findOne({ number });

		if (!owner) {
			return res.status(404).json({
				success: false,
				message: "Owner not registered with this number",
			});
		}

		// Update tokens in DB
		const { access_token } = await updateHubSpotTokens(owner);
		const hubspotOwner = await getOwner(access_token);
		const contacts = await getContacts(access_token);

		const toContact = contacts.filter(
			(contact) => contact.properties.email == toEmail
		)[0];
		console.log("Contacts", toContact);

		if (!toContact) {
			return res.status(404).json({
				success: false,
				message: "Contact doesn't exist with this email",
			});
		}

		const emailHeader = {
			from: {
				email: hubspotOwner.email,
				firstName: hubspotOwner.firstName,
				lastName: hubspotOwner.lastName,
			},
			to: [
				{
					email: `${toContact.properties.firstname} ${toContact.properties.lastname}<${toContact.properties.email}>`,
					firstName: toContact.properties.firstName,
					lastName: toContact.properties.lastName,
				},
			],
			cc: [],
			bcc: [],
		};

		const emailRequestBody = {
			properties: {
				hs_timestamp: new Date().toISOString(),
				hubspot_owner_id: hubspotOwner.id,
				hs_email_direction: "EMAIL",
				hs_email_status: "SENT",
				hs_email_subject: subject,
				hs_email_text: body,
				hs_email_headers: JSON.stringify(emailHeader),
			},
			associations: [
				{
					to: {
						id: toContact.id,
					},
					types: [
						{
							associationCategory: "HUBSPOT_DEFINED",
							associationTypeId: 198,
						},
					],
				},
			],
		};

		console.log("Email Request Body", emailRequestBody);

		const url = `${base_url}/crm/v3/objects/emails`;
		const config = {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		};
		const { data: emailResponse } = await axios.post(
			url,
			emailRequestBody,
			config
		);

		console.log("EmailResponse", emailResponse);

		if (emailResponse) {
			return res.status(200).json({
				success: true,
				message: "Email sent successfully",
				data: emailResponse,
			});
		}
	} catch (error) {
		console.log("Error while creating a new email: ", error.message);
		return res.status(500).json({
			success: false,
			message: "Error while creating a new email",
			error: error.message,
		});
	}
}
