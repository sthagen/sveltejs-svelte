/** @import { BlockStatement, Statement, Expression } from 'estree' */
/** @import { AST } from '#compiler' */
/** @import { ComponentContext } from '../types' */
import { dev } from '../../../../state.js';
import * as b from '#compiler/builders';

/**
 * @param {AST.SvelteBoundary} node
 * @param {ComponentContext} context
 */
export function SvelteBoundary(node, context) {
	const props = b.object([]);

	for (const attribute of node.attributes) {
		if (attribute.type !== 'Attribute' || attribute.value === true) {
			// these can't exist, because they would have caused validation
			// to fail, but typescript doesn't know that
			continue;
		}

		const chunk = Array.isArray(attribute.value)
			? /** @type {AST.ExpressionTag} */ (attribute.value[0])
			: attribute.value;

		const expression = /** @type {Expression} */ (context.visit(chunk.expression, context.state));

		if (chunk.metadata.expression.has_state) {
			props.properties.push(b.get(attribute.name, [b.return(expression)]));
		} else {
			props.properties.push(b.init(attribute.name, expression));
		}
	}

	const nodes = [];

	/** @type {Statement[]} */
	const external_statements = [];

	/** @type {Statement[]} */
	const internal_statements = [];

	const snippets_visits = [];

	// Capture the `failed` implicit snippet prop
	for (const child of node.fragment.nodes) {
		if (child.type === 'SnippetBlock' && child.expression.name === 'failed') {
			// we need to delay the visit of the snippets in case they access a ConstTag that is declared
			// after the snippets so that the visitor for the const tag can be updated
			snippets_visits.push(() => {
				/** @type {Statement[]} */
				const init = [];
				context.visit(child, { ...context.state, init });
				props.properties.push(b.prop('init', child.expression, child.expression));
				external_statements.push(...init);
			});
		} else if (child.type === 'ConstTag') {
			/** @type {Statement[]} */
			const init = [];
			context.visit(child, { ...context.state, init });

			if (dev) {
				// In dev we must separate the declarations from the code
				// that eagerly evaluate the expression...
				for (const statement of init) {
					if (statement.type === 'VariableDeclaration') {
						external_statements.push(statement);
					} else {
						internal_statements.push(statement);
					}
				}
			} else {
				external_statements.push(...init);
			}
		} else {
			nodes.push(child);
		}
	}

	snippets_visits.forEach((visit) => visit());

	const block = /** @type {BlockStatement} */ (context.visit({ ...node.fragment, nodes }));

	if (dev && internal_statements.length) {
		block.body.unshift(...internal_statements);
	}

	const boundary = b.stmt(
		b.call('$.boundary', context.state.node, props, b.arrow([b.id('$$anchor')], block))
	);

	context.state.template.push_comment();
	context.state.init.push(
		external_statements.length > 0 ? b.block([...external_statements, boundary]) : boundary
	);
}
