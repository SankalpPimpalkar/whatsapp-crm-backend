import axios from "axios";
import { base_url } from "../constants.js";
import { User } from "../models/user.models.js";
import updateHubSpotTokens from "../utils/updateTokens.js";
import getContacts from "../utils/getContacts.js";

async function createNoteInHubspot(noteDetails, owner) {
	try {
		let properties = {
			hs_timestamp: new Date().toISOString(),
			hs_note_body: noteDetails.note,
		};

		const [firstName, lastName] = noteDetails.owner.split(" ");

		const { access_token } = await updateHubSpotTokens(owner);
		const contacts = await getContacts(access_token);

		const targetedContact = contacts.find(
			(contact) =>
				contact.properties.firstname === firstName &&
				contact.properties.lastname === lastName
		);

		if (!targetedContact) {
			throw new Error(
				`No matching contact found for ${firstName} ${lastName}`
			);
		}

		// Move associations outside of properties
		const requestBody = {
			properties,
			associations: [
				{
					types: [
						{
							associationCategory: "HUBSPOT_DEFINED",
							associationTypeId: 202,
						},
					],
					to: {
						id: targetedContact.id,
					},
				},
			],
		};

		const createNoteUrl = `${base_url}/crm/v3/objects/notes`;
		const createNoteConfig = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
			},
		};

		const { data: noteData } = await axios.post(
			createNoteUrl,
			requestBody,
			createNoteConfig
		);

		console.log("Created Note:", noteData);

		return noteData;
	} catch (error) {
		console.error(
			"Error while creating a note:",
			error?.response?.data || error
		);
		throw new Error(
			error?.response?.data?.message || "Failed to create note in HubSpot"
		);
	}
}

export async function createNote(req, res) {
	try {
		const { number, noteDetails } = req.body;

		const owner = await User.findOne({ number });

		if (!owner) {
			return res.status(404).json({
				success: false,
				message: "Owner not registered with this number",
			});
		}

		const note = await createNoteInHubspot(noteDetails, owner);

		return res.status(200).json({
			success: true,
			message: "Successfully created note",
			data: note,
		});
	} catch (error) {
		console.log("Error while creating a new note: ", error.message);
		return res.status(500).json({
			success: false,
			message: "Error while creating a new note",
			error: error.message,
		});
	}
}
