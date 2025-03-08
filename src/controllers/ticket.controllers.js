import { access_token, base_url } from "../constants";
import { User } from "../models/user.models";

async function createTicketInHubspot(ticketDetails) {
	try {
		const ticketProperties = {
			properties: {
				hs_pipeline: ticketDetails.pipeline,
				hs_lastmodifieddate: new Date().toISOString(),
				hs_pipeline_stage: ticketDetails.pipelineStage || "1",
				hubspot_owner_id: ticketDetails.ownerId,
				source_type: ticketDetails.source || "PHONE",
				hs_ticket_priority: ticketDetails.priority || "LOW",
				subject: ticketDetails.name,
				content: ticketDetails.description || "",
			},
			associations: ticketDetails.associations || [],
		};

		const ticketUrl = `${base_url}/crm/v3/objects/tickets`;
		const ticketHeaders = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
			},
		};

		const { data: ticketData } = await axios.post(
			ticketUrl,
			ticketProperties,
			ticketHeaders
		);

        return ticketData;

	} catch (error) {
		console.error(
			"Error while creating a ticket:",
			error?.response?.data || error
		);
		throw new Error(
			error?.response?.data?.message ||
				"Failed to create ticket in HubSpot"
		);
	}
}

export async function createTicket(req, res) {
	try {
		const { number, ticketDetails } = req.body;
		const owner = await User.findOne({ number });

		if (!owner) {
			return res.status(404).json({
				success: false,
				message: "Owner not registered with this number",
			});
		}

        const ticket = await createTicketInHubspot(ticketDetails);

        if(!ticket) {
            throw "Failed to create ticket"
        }

        return res.status(200).json({
			success: true,
			message: "Successfully created ticket",
			data: ticket,
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
