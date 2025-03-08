import axios from "axios";
import { access_token, base_url } from "../constants.js";
import { User } from "../models/user.models.js";

async function createNoteInHubspot(noteDetails) {
	try {
		let properties = {
			hs_timestamp: new Date().toISOString(),
			hs_note_body: noteDetails.note,
		};

		if (!noteDetails.owner) {
			throw new Error("Owner field is required in noteDetails");
		}

		let [firstName, lastName] = noteDetails.owner.split(" ");

		// Search for Contact by Firstname & Lastname
		const searchContactsUrl = `${base_url}/crm/v3/objects/contacts/search`;
		const searchContactsConfig = {
			headers: {
				Authorization: `Bearer ${access_token}`,
				"Content-Type": "application/json",
			},
		};

		const searchRequestBody = {
			filterGroups: [
				{
					filters: [
						{
							propertyName: "firstname",
							operator: "EQ",
							value: firstName,
						},
						{
							propertyName: "lastname",
							operator: "EQ",
							value: lastName,
						},
					],
				},
			],
		};

		const { data: searchData } = await axios.post(
			searchContactsUrl,
			searchRequestBody,
			searchContactsConfig
		);

		if (!searchData.results.length) {
			throw new Error(
				"Contact does not exist with this firstName and lastName"
			);
		}

		const contact = searchData.results[0]; // First matched contact
		console.log("Contact", contact);

		// Step 1: Create the Note
		const noteProperties = {
			properties,
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
			noteProperties,
			createNoteConfig
		);

		console.log("Created Note:", noteData);

		// Step 2: Associate the Note with the Contact
		const associateNoteUrl = `${base_url}/crm/v3/associations/note/contact/batch/create`;

		const associateNoteBody = {
			inputs: [
				{
					from: { id: noteData.id }, // Note ID
					to: { id: contact.id }, // Contact ID
					type: "280", // Note ↔ Contact Association Type ID
				},
			],
		};

		await axios.post(associateNoteUrl, associateNoteBody, createNoteConfig);

		console.log("Note successfully associated with contact:", contact.id);

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

		const Owner = await User.findOne({ number });

		if (!Owner) {
			return res.status(404).json({
				success: false,
				message: "Owner not registered with this number",
			});
		}

		const note = await createNoteInHubspot(noteDetails);

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
