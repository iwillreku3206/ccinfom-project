/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-19 13:53:00
 * @ Modified time: 2024-11-22 14:38:06
 * @ Description:
 * 
 * A template for model classes.
 */

import { type RowDataPacket, type ResultSetHeader, type QueryResult } from "mysql2"
import { db } from "../app/database"
import log from "log"
import { which } from "bun";

export type SQLValue = string | number | boolean | Date
export type SQLValueList = Record<string, SQLValue>

/**
 * Consider this an abstract class which we can extend for other models.
 * 
 * @class 
 */
export default class Model {

  /**
   * A map of queries.
   * Each query contains a function that dispatches the query to the db class.
   */
  private QUERIES: Map<string, <T extends QueryResult>(values: SQLValueList) => Promise<T>>;


  /**
   * Helper function for executing queries.
   * Destructures the result automatically.
   * 
   * @param query_string	The query string to execute. 
   * @return							A promise for the results of the query.
   */
  private async query<T extends QueryResult>(queryString: string, params: any[]): Promise<T> {
    const filteredParams = params.map(p => p === undefined ? null : p)
    const [results, _] =
      await db.execute(queryString, filteredParams)
    return results as T
  }

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
  protected register(name: string, sqlQuery: string, mapper: (values: SQLValueList) => SQLValue[]) {
    this.QUERIES.set(name, async (values: SQLValueList) => {
      return this.query(sqlQuery, mapper(values))
    })
  }
  /**
   * Executes the requested query if it exists.
   * 
   * @param name		The name of the query to execute. 
   * @param	input		Input to the query object.
   * @return				A promise for the results of the query.
   */
  protected async execute<T extends QueryResult>(
    name: string,
    input: SQLValueList
  ): Promise<T> {
    const q = this.QUERIES.get(name) ?? null
    if (!q) {
      return Promise.reject(`Query '${name}' does not exist`)
    }
    try {
      return q(input)
    } catch (e) {
      return Promise.reject(`Error executing ${name}: ${e}`)
    }
  }

  constructor() {
    this.QUERIES = new Map<string, <T extends QueryResult>(values: SQLValueList) => Promise<T>>()
  }
};
