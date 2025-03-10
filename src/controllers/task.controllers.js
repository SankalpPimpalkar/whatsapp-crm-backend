import axios from "axios";
import { base_url } from "../constants.js";
import { User } from "../models/user.models.js";
import { updateHubSpotTokens } from "./auth.controllers.js";

export async function getOwner(access_token) {
	try {
		const url = `${base_url}/crm/v3/owners/`;
		const config = {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		};

		const response = await axios.get(url, config);
		const owners = response.data.results;

		return owners[0].id;
	} catch (error) {
		console.error(
			"Error while getting owner details",
			error?.response?.data || error
		);
		throw new Error(
			error?.response?.data?.message ||
				"Error while getting owner details"
		);
	}
}

export async function createTask(req, res) {
	try {
		const { number, taskDetails } = req.body;
		const owner = await User.findOne({ number });

		if (!owner) {
			return res.status(404).json({
				success: false,
				message: "Owner not registered with this number",
			});
		}

		const { access_token } = await updateHubSpotTokens(owner);
		const ownerId = await getOwner(access_token);

		const taskProperties = {
			properties: {
				hs_task_subject: taskDetails.subject,
				hs_task_status: taskDetails.status || "NOT_STARTED",
				hs_timestamp: taskDetails.dueDate,
				hubspot_owner_id: ownerId,
			},
			associations: taskDetails.associations || [],
		};

		const taskUrl = `${base_url}/crm/v3/objects/tasks`;
		const taskHeaders = {
			headers: {
				"Content-Type": "application/json",
				"authorization": `Bearer ${access_token}`,
			},
		};

		const { data: taskData } = await axios.post(
			taskUrl,
			taskProperties,
			taskHeaders
		);

		if (!taskData) {
			throw "Failed to create task data";
		}

		return res.status(200).json({
			success: true,
			message: "Successfully created task",
			data: taskData,
		});
	} catch (error) {
		console.log("Failed to create ticket: ", error.message);
		return res.status(500).json({
			success: false,
			message: "Failed to create ticket",
			error: error.message,
		});
	}
}
