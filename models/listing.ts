/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 10:43:56
 * @ Modified time: 2024-11-16 14:20:28
 * @ Description:
 * 
 * Manages mapping listings to runtime objects.
 */

import { type RowDataPacket, type ResultSetHeader } from "mysql2"
import { db } from "../app/database"
import log from "log"
import argon2 from 'argon2'

export const Listing = (() => {

	/**
	 * The Listing interface.
	 */
	interface _Listing {
		id: number,
		item: number,
		price: number,
		seller: number,
		list_date: Date,
		sold: number,
	}

	// The table we're using
	const TABLE = `\`listings\``;

	// A list of specs for the corresponding queries
	type create_listing_spec = Omit<_Listing, 'id' | 'list_date' | 'sold'>;
	type get_listing_spec = Partial<_Listing>;

	// A list of queries 
	const create_listing_query = `INSERT INTO ${TABLE} (item, price, seller) VALUES (?, ?, ?);`;
	const get_listings_query = `SELECT * FROM ${TABLE};`;
	const get_listing_by_item_query = `SELECT * FROM ${TABLE} WHERE item = ?;`;
	const get_listing_by_price_query = `SELECT * FROM ${TABLE} WHERE price BETWEEN ? AND ?;`;
	const get_listing_by_seller_query = `SELECT * FROM ${TABLE} WHERE seller = ?;`;
	const get_listing_by_list_date_query = `SELECT * FROM ${TABLE} WHERE list_date BETWEEN ? AND ?;`;

	/**
	 * Helper function for executing queries.
	 * Destructures the result automatically.
	 * 
	 * @param query_string	The query string to execute. 
	 * @return							A promise for the results of the query.
	 */
	const query = async (queryString: string, ...params: any[]) => 
		(([ results, _ ]) => (results))
			(await db.execute<ResultSetHeader>(queryString, params))

	// The public methods of the class.
	const _ = {
		
		/**
		 * Creates a new listing in the database.
		 * 
		 * @return	A promise for the results of the insert query. 
		 */
		createListing: (listing: create_listing_spec) => (
			query(create_listing_query, listing.item, listing.price, listing.seller)
				.then((results) => ({ ...results }))
		),
		
		/**
		 * Grabs listings given the provided filters.
		 * 
		 * @param	filter		The column to filter by.
		 * @param	values		The values to use for the filter. 
		 * @return					A promise for the results of the select query. 
		 */
		getListings: (filter?: String, ...values: any[]) => (
			(console.log(filter),
				filter === 'item' 			? query(get_listing_by_item_query, ...values) 
			: filter === 'price' 			? query(get_listing_by_price_query, ...values)
			: filter === 'seller' 		? query(get_listing_by_seller_query, ...values)
			: filter === 'list_date' 	? query(get_listing_by_list_date_query, ...values)
			: query(get_listings_query))
		)
	}

	return {
		..._,
	}

})();

