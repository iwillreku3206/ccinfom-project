/**
 * @ Author: Group 1
 * @ Create Time: 2024-11-23 02:57:02
 * @ Modified time: 2024-11-23 03:04:49
 * @ Description:
 * 
 * Our middleware plugins.
 */

import type { Request, Response, NextFunction } from "express";
import UserModel from "../models/user";
import log from "log";

/**
 * Appends the current logged in user to the context of each pipe. 
 * If not logged in, we redirect to the home page.
 */
export const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => (
  res.locals.user = await UserModel.instance.getUserBySession(req.cookies.session),
  res.locals.user ?? res.clearCookie('session').redirect('/'),
  next()
)

/**
 * Checks whether or not the current user is an admin.
 * Redirects to home page otherwise.
 */
export const isAdmin = async (_: Request, res: Response, next: NextFunction) => (
    !res.locals.user && log.error("Run isLoggedIn first!"),
    res.locals.user.userType === 'admin'
      ? next()
      : res.redirect('/home?error=unauthorized')
)

/**
 * Creates a new function that returns an error handler.
 * See gameController.ts or listingController.ts for more info on how to use.
 * NOTE: this function is a middleware GENERATOR, not middleware itself.
 *  
 * @param descriptions  The descriptions of each error to handle.
 * @returns             An error handling middleware func. 
 */
export const createErrorHandler = (descriptions: Map<string, string>) => (

  // Create a new middleware that handles translating error keys to error messages 
  (req: Request, res: Response, next: NextFunction) => (
    
    // Grab the error from the query first
    res.locals.error = req.query.error?.toString(),

    // For each description, replace error key with it
    res.locals?.error && 
      descriptions.forEach(
        (description: string, error: string) => (
          res.locals.error = 
          res.locals.error.replace(error, description))),
    
    // Call next middleware
    next()
  )
)