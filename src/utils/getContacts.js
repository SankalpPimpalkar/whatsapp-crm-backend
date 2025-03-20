import axios from "axios";
import { base_url } from "../constants.js";

export default async function getContacts(access_token){
	try {
		const url = `${base_url}/crm/v3/objects/contacts/`;
		const config = {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		};

		const {data: contactsData} = await axios.get(url, config);

		return contactsData.results

	} catch (error) {
		console.error(
			"Error while getting contacts",
			error?.response?.data || error
		);
		throw new Error(
			error?.response?.data?.message ||
				"Error while getting contacts"
		);
	}
}
