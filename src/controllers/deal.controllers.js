import axios from "axios";
import { access_token, base_url } from "../constants";
import { User } from "../models/user.models";

async function createDealInHubspot(dealDetails) {
	try {
		const dealProperties = {
			properties: {
				dealname: dealDetails.dealName,
				hs_priority: dealDetails.priority || "LOW",
				pipeline: dealDetails.pipeline,
				dealstage: dealDetails.dealStage,
				amount: dealDetails.amount,
				closedate: new Date(dealDetails.closeDate).toISOString(),
				hubspot_owner_id: dealDetails.ownerId,
				dealtype: dealDetails.dealType || "newbusiness",
			},
			associations: dealDetails.associations || [],
		};
		console.log("dealProperties", dealProperties);

		const dealUrl = `${base_url}/crm/v3/objects/deals`;
		const dealHeaders = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
			},
		};

		const { data: dealData } = await axios.post(
			dealUrl,
			dealProperties,
			dealHeaders
		);

		if (!dealData) {
			throw "Failed to create deal in hubspot";
		}

		const ownerUrl = `${base_url}/crm/v3/owners/${dealData.properties.hubspot_owner_id}`;
		const ownerheader = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
			},
		};

		const { data: ownerData } = await axios.get(ownerUrl, ownerheader);

		if (!ownerData) {
			throw "Failed to get owner data from hubspot";
		}

		return {
			...dealData,
			owner: ownerData,
		};
	} catch (error) {
		console.error(
			"Error while creating a deal:",
			error?.response?.data || error
		);
		throw new Error(
			error?.response?.data?.message || "Failed to create deal in HubSpot"
		);
	}
}

export async function createDeal(req, res) {
	try {
		const { number, dealDetails } = req.body;
		const owner = await User.findOne({ number });

		if (!owner) {
			return res.status(404).json({
				success: false,
				message: "Owner not registered with this number",
			});
		}

		const deal = await createDealInHubspot(dealDetails);

		if (!deal) {
			throw "Failed to create deal";
		}

		return res.status(200).json({
			success: true,
			message: "Successfully created deal",
			data: deal,
		});
	} catch (error) {
		console.log("Error while creating a new deal: ", error.message);
		return res.status(500).json({
			success: false,
			message: "Error while creating a new deal",
			error: error.message,
		});
	}
}
