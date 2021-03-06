/*
 * @license
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict';

import * as vscode from 'vscode';
import * as components from './data/components.json';
import {SLDSContext, ContextKey} from "./context";
import { shouldExecuteForDocument } from './utilities';

const documentSelector = { pattern: '**/*.{cmp,haml,handlebars,htm,html,jade,jsx,php}', scheme: 'file' };
const triggerChars = 'abcdefghijklmnopqrstuvwxyz1234567890-_'.split('');

// determine if current state warrants looking for completion items
// if yes return range of text that would be replaced, if no return undefined
function shouldTriggerCompletions(document: vscode.TextDocument, position: vscode.Position): vscode.Range | undefined {
	// must start with "slds-" plus a letter
	let triggerRange = document.getWordRangeAtPosition(position, /\bslds-[a-z][\w-]*/i);
	return triggerRange;
}

// get list of completion items to display, potentially replacing the provided text range
function getCompletions(range: vscode.Range): vscode.CompletionList {
	let completions = components.classes.map(cssClass => {
		let completionItem = new vscode.CompletionItem(cssClass.selector);
		completionItem.kind = vscode.CompletionItemKind.Value;
		completionItem.detail = cssClass.component;
		completionItem.documentation = cssClass.summary;

		// some langs treat "-" as a word separator and so they won't replace "slds-" upon completion commit
		// this sets the replaced range to what we regex'd earlier so the "slds-" is included when replacing
		completionItem.range = range;

		return completionItem;
	});

	return new vscode.CompletionList(completions, false);
}

export function register(): vscode.Disposable {
	const provider = {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			if (!!! shouldExecuteForDocument(document.uri))  {
				return undefined;
			}

			let triggerRange = SLDSContext.isEnable(ContextKey.GLOBAL, ContextKey.AUTO_SUGGEST) 
				? shouldTriggerCompletions(document, position) : false;
			return triggerRange ? getCompletions(triggerRange) : undefined;
		}
	};
	return vscode.languages.registerCompletionItemProvider(documentSelector, provider, ...triggerChars);
}
