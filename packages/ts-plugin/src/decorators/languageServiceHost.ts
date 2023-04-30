import { Decorator, composeDecorators } from '../factories'
import { getScriptKindDecorator } from './getScriptKind'
import { getScriptSnapshotDecorator } from './getScriptSnapshot'
import { resolveModuleNameLiteralsDecorator } from './resolveModuleNameLiterals'

/**
 * Decorates the server host with functionality to handle `.sol` files.
 * is a composite decorator of the following:
 * - `resolveModuleNameLiteralsDecorator`
 * - `getScriptSnapshotDecorator`
 * - `getScriptKindDecorator`
 * @see https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#decorator-creation
 * @see {@link Decorator}
 * @see {@link resolveModuleNameLiteralsDecorator}
 * @see {@link getScriptSnapshotDecorator}
 * @see {@link getScriptKindDecorator}
 */
export const languageServiceHostDecorator: Decorator = composeDecorators(
  resolveModuleNameLiteralsDecorator,
  getScriptSnapshotDecorator,
  getScriptKindDecorator,
)