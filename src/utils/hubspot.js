const axios = require("axios");
const qs = require("qs");

// Helper function to create a Hubspot instance
export const createHubspotInstance = (owner) => {
	console.log("=========  Hubspot  ==========");
	const url = `https://api.hubapi.com`;
	const userId = owner._id;
	const ownerNumber = owner.number;
	const access_token = owner?.integrationTokens?.hubspot?.access_token;
	const refresh_token = owner?.integrationTokens?.hubspot?.refresh_token;

	return {
		url,
		userId,
		ownerNumber,
		access_token,
		refresh_token,
	};
};

// Function to get new tokens
export const getNewTokensHubspot = async (hubspotInstance) => {
	console.log("=========  getting new tokens  ==========");
	try {
		const data = {
			grant_type: "refresh_token",
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			refresh_token: hubspotInstance.refresh_token,
		};
		const headers = {
			"Content-Type": "application/x-www-form-urlencoded",
		};

		const url = `${hubspotInstance.url}/oauth/v1/token`;
		const response = await axios.post(url, qs.stringify(data), { headers });
		const { access_token, refresh_token } = response.data;
		hubspotInstance.access_token = access_token;
		hubspotInstance.refresh_token = refresh_token;
		return access_token;
	} catch (error) {
		console.error("Error while getting new token", error);
	}
};

// Function to revoke user
export const revokeUser = async (hubspotInstance) => {
	console.log("=========  revokeUser hubspot  ==========");
	try {
		const url = `${hubspotInstance.url}/oauth/v1/refresh-tokens/${hubspotInstance.refresh_token}`;
		const headers = {
			Authorization: `Bearer ${hubspotInstance.access_token}`,
		};
		const response = await axios.delete(url, { headers });
		return true;
	} catch (error) {
		console.log(error.status);
		return true;
	}
};

// Function to get all deals
export const getAllDeals = async (hubspotInstance) => {
	console.log("=========  getting all deals hubspot  ==========");
	const properties = [
		"amount",
		"amount_in_home_currency",
		"closedate",
		"closed_lost_reason",
		"closed_won_reason",
		"createdate",
		"days_to_close",
		"dealId",
		"dealname",
		"dealstage",
		"dealtype",
		"description",
		"hubspot_owner_id",
		"hs_closed_amount",
		"hs_closed_amount_in_home_currency",
		"hs_deal_stage_probability",
		"hs_is_closed",
		"hs_object_id",
		"hs_projected_amount",
		"hs_projected_amount_in_home_currency",
		"hs_updated_by_user_id",
		"hubspot_owner_assigneddate",
		"hubspot_owner_id",
		"num_associated_contacts",
		"num_contacted_notes",
		"num_notes",
		"updatedAt",
		"pipeline",
		"hs_priority",
	];

	try {
		const url = `${
			hubspotInstance.url
		}/crm/v3/objects/deals?associations=companies&associations=contacts&properties=${properties.join(
			","
		)}`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${hubspotInstance.access_token}`,
		};
		let { data } = await axios.get(url, { headers });
		return data?.results;
	} catch (error) {
		console.log("Error in getting deals:", error.message);
	}
};

// Function to get all pipelines
export const getAllPipelines = async (hubspotInstance, obj) => {
	console.log("=========  Getting all pipelines from HubSpot  ==========");
	try {
		const url = `${hubspotInstance.url}/crm/v3/pipelines/${obj}`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${hubspotInstance.access_token}`,
		};
		let { data } = await axios.get(url, { headers });
		return data.results;
	} catch (error) {
		console.log("Error in getting pipelines:", error.message);
		throw error;
	}
};

// Function to get a deal by ID
export const getDealsById = async (hubspotInstance, id) => {
	console.log("=========  getting deal by id in hubspot  ==========");
	const properties = [
		"amount",
		"amount_in_home_currency",
		"closedate",
		"closed_lost_reason",
		"closed_won_reason",
		"createdate",
		"days_to_close",
		"dealId",
		"dealname",
		"dealstage",
		"dealtype",
		"description",
		"hubspot_owner_id",
		"hs_closed_amount",
		"hs_closed_amount_in_home_currency",
		"hs_deal_stage_probability",
		"hs_is_closed",
		"hs_object_id",
		"hs_projected_amount",
		"hs_projected_amount_in_home_currency",
		"hs_updated_by_user_id",
		"hubspot_owner_assigneddate",
		"hubspot_owner_id",
		"num_associated_contacts",
		"num_contacted_notes",
		"num_notes",
		"updatedAt",
		"pipeline",
	];
	try {
		const url = `${
			hubspotInstance.url
		}/crm/v3/objects/deals/${id}?associations=companies&associations=contacts&properties=${properties.join(
			","
		)}`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${hubspotInstance.access_token}`,
		};
		let { data } = await axios.get(url, { headers });
		let owner = await getOwnerById(
			hubspotInstance,
			data?.properties?.hubspot_owner_id
		);
		return { ...data, owner };
	} catch (error) {
		console.log("error in getting deals", error.message);
	}
};

// Function to create a task
export const createTask = async (hubspotInstance, taskDetails) => {
	console.log("=========  creating task in hubspot  ==========");
	let ownerId;
	if (taskDetails.ownerId) {
		ownerId = taskDetails.ownerId;
	} else {
		const [firstName, lastName] = taskDetails.owner.split(" ");
		ownerId = await getOwnerIdByName(hubspotInstance, firstName, lastName);
	}

	const taskProperties = {
		properties: {
			hs_task_subject: taskDetails.subject,
			hs_task_status: taskDetails.status || "NOT_STARTED",
			hs_timestamp: taskDetails.dueDate,
			hubspot_owner_id: ownerId,
		},
		associations: taskDetails.associations || [],
	};

	try {
		const url = `${hubspotInstance.url}/crm/v3/objects/tasks`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${hubspotInstance.access_token}`,
		};
		const { data } = await axios.post(url, taskProperties, { headers });
		return data;
	} catch (error) {
		console.log("error in creating task", error.message);
		throw new Error("Failed to create task: " + error.message);
	}
};

// Function to edit a contact
export const editContact = async (hubspotInstance, contactDetails) => {
	console.log("=========  creating contact in HubSpot  ==========");
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
		const url = `${hubspotInstance.url}/crm/v3/objects/contacts/${contactDetails.contactId}?replace=true`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${hubspotInstance.access_token}`,
		};
		const { data } = await axios.patch(url, contactProperties, { headers });
		return data;
	} catch (error) {
		console.log("Error in updating contact", error.message);
		throw new Error("Failed to update contact: " + error.message);
	}
};

// Function to get all owners
export const getAllOwners = async (hubspotInstance) => {
	const url = `${hubspotInstance.url}/crm/v3/owners/`;
	const headers = {
		Authorization: `Bearer ${hubspotInstance.access_token}`,
	};
	try {
		const response = await axios.get(url, { headers });
		return response.data.results;
	} catch (error) {
		console.log(
			"Error fetching owners:",
			error.response ? JSON.stringify(error.response.data) : error.message
		);
	}
};

// Function to get owner ID by name
export const getOwnerIdByName = async (hubspotInstance, firstName, lastName) => {
	const owners = await getAllOwners(hubspotInstance);
	const owner = owners.find(
		(owner) => owner.firstName === firstName && owner.lastName === lastName
	);
	return owner?.id?.toString();
};

// Function to get owner by ID
export const getOwnerById = async (hubspotInstance, id) => {
	console.log("=========  getting owner by id in hubspot  ==========");
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${hubspotInstance.access_token}`,
	};
	try {
		const response = await axios.get(
			`${hubspotInstance.url}/crm/v3/owners/${id}`,
			{ headers }
		);
		return response.data;
	} catch (error) {
		console.log("error in getting owner ", error.message);
	}
};

