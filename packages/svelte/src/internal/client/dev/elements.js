/** @import { SourceLocation } from '#client' */
import { COMMENT_NODE, DOCUMENT_FRAGMENT_NODE, ELEMENT_NODE } from '#client/constants';
import { HYDRATION_END, HYDRATION_START, HYDRATION_START_ELSE } from '../../../constants.js';
import { hydrating } from '../dom/hydration.js';
import { dev_stack } from '../context.js';

/**
 * @param {any} fn
 * @param {string} filename
 * @param {SourceLocation[]} locations
 * @returns {any}
 */
export function add_locations(fn, filename, locations) {
	return (/** @type {any[]} */ ...args) => {
		const dom = fn(...args);

		var node = hydrating ? dom : dom.nodeType === DOCUMENT_FRAGMENT_NODE ? dom.firstChild : dom;
		assign_locations(node, filename, locations);

		return dom;
	};
}

/**
 * @param {Element} element
 * @param {string} filename
 * @param {SourceLocation} location
 */
function assign_location(element, filename, location) {
	// @ts-expect-error
	element.__svelte_meta = {
		parent: dev_stack,
		loc: { file: filename, line: location[0], column: location[1] }
	};

	if (location[2]) {
		assign_locations(element.firstChild, filename, location[2]);
	}
}

/**
 * @param {Node | null} node
 * @param {string} filename
 * @param {SourceLocation[]} locations
 */
function assign_locations(node, filename, locations) {
	var i = 0;
	var depth = 0;

	while (node && i < locations.length) {
		if (hydrating && node.nodeType === COMMENT_NODE) {
			var comment = /** @type {Comment} */ (node);
			if (comment.data === HYDRATION_START || comment.data === HYDRATION_START_ELSE) depth += 1;
			else if (comment.data[0] === HYDRATION_END) depth -= 1;
		}

		if (depth === 0 && node.nodeType === ELEMENT_NODE) {
			assign_location(/** @type {Element} */ (node), filename, locations[i++]);
		}

		node = node.nextSibling;
	}
}
