import * as PACKAGE from '../package.json'

//-------------------------------
// Import your source files here
//-------------------------------

import 'import_folder_recursive:./panels'
// Blockbench Patches
import 'import_folder_recursive:./patches'
// Misc imports

// Provide a global object for other plugins to interact with
// @ts-expect-error
window[PACKAGE.name] = {}

// This must be imported last.
import './plugin'
