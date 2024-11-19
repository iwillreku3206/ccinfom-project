/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-19 13:53:00
 * @ Modified time: 2024-11-19 16:38:54
 * @ Description:
 * 
 * A template for model classes.
 */

import { type RowDataPacket, type ResultSetHeader, type QueryResult } from "mysql2"
import { db } from "../app/database"
import log from "log"

/**
 * Consider this an abstract class which we can extend for other models.
 * 
 * @class 
 */
export const Model = <IModel>() => {

	/**
	 * A map of queries.
	 * Each query contains a function that dispatches the query to the db class.
	 */
	const QUERIES = new Map<string, Function>();
	
	/**
	 * Helper function for executing queries.
	 * Destructures the result automatically.
	 * 
	 * @param query_string	The query string to execute. 
	 * @return							A promise for the results of the query.
	 */
	const query = async (queryString: string, ...params: any[]) => 
		(([ results, _ ]) => (
			results.length
				? results
				: []
		))(await db.execute<QueryResult & RowDataPacket[]>(queryString, params))

	// Public class interface
	const _ =  {

		/**
		 * Registers a query that works on "subtypes" of the IModel interface (created through Omit, Partial, etc.).
		 * Maybe we have a subtype that doesn't need all the fields, that's why we can't just use IModel.
		 * For more information on how to use this, check out the implementation in the other classes (listing.ts).
		 * 
		 * @param	name					The name of the query to register.
		 * @param	query_string	The query to associate with the name.
		 * @param	mapper				Maps the properties of the input into an array.
		 * @return							The api.
		 */
		register: (
			name: 				string, 
			query_string: string, 
			mapper: 			Function=((i: any) => i)
		) => (

			// Register the query into the map
			QUERIES.set(name, (input: any) => query(query_string, ...mapper(input))),
			_
		),

		/**
		 * Executes the requested query if it exists.
		 * 
		 * @param name		The name of the query to execute. 
		 * @param	input		Input to the query object.
		 * @return				A promise for the results of the query.
		 */
		execute: (
			name: 	string, 
			input: 	any=null
		): Promise<any> => (
		
			// Execute the query if it exists, otherwise throw an error
			((action=(() => Promise.reject(`Query '${name}' does not exist`))) => action(input))

			// Grab the query action
			(QUERIES.get(name) ?? undefined)
		)

	}

	return {
		..._
	};
}
