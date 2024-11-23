/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-22 14:42:30
 * @ Modified time: 2024-11-23 19:37:51
 * @ Description:
 * 
 * A bunch of front-end utils just to make our lives easier.
 */

const DOM = (() => {

	// Class interface
	const _ = {};

	// Helper func
	const fluent = (element) => Object.assign(element, {
				
		// Append children to the element
		append: (...children) => 
			(children.map(child => element.appendChild(child)), element),

		// Sets the text content of the element
		txt: (text) => (
			text !== undefined
				? (element.textContent = text, element)
				: (element.outerHTML) 
		),

		// Sets element attributes
		attribs: (attribs) => (
			Object.keys(attribs).map(attrib => 
				element.setAttribute(attrib, attribs[attrib])),
			element
		),

		// Set the style of the element with the object provided
		stl: (styles) => (
			Object.keys(styles).map(style => 
				element.style[style] = styles[style]),
			element
		),

		// Shorthand for adding event listeners
		listen: (event, listener) => (
			element.addEventListener(event, listener),
			element
		),

		// Sends an event to the element
		dispatch: (event) => (
			element.dispatchEvent(new Event(event)),
			element
		),
			
		// Sets the class names of the element
		class: (...classes) => (
			classes.length 
				? (classes.map(c => element.classList.add(c)), element)
				: (Array.from(element.classList))
		)
	})

	/**
	 * Creates a new element with the given tag name.
	 * 
	 * @param tag		The tag of the element to create. 
	 * @return			A new dom element with that tag name.
	 */
	_.element = (tag) => fluent(document.createElement(tag))

	/**
	 * Selects elements from the document and returns a fluent version of them.
	 * Uses query selectors.
	 *  
	 * @param selector	The selector to use. 
	 * @return					The element or a collection of elements.
	 */
	_.select = (selector) => (
		((selection) => (
			selection.length === 1 
				? fluent(selection[0])
				: Array.from(selection).map(s => fluent(s)) 
		))(document.querySelectorAll(selector)) 
	)

	/**
	 * Create a post request to the target with the given body.
	 * 
	 * @param target	The target of the post request.
	 * @returns				A promise containing the result of the request. 
	 */
	_.post = (target, content) => (
		fetch(target, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }, 
			body: JSON.stringify(content)
		})
	)

	return {
		..._
	}

})()
