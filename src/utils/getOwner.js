import axios from "axios";
import { base_url } from "../constants.js";

export default async function getOwner(access_token) {
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