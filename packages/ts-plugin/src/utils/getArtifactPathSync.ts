import { Config, Logger } from '../factories'
import { globSync } from 'glob'
import { join } from 'path'

/**
 * Gets artifacts path
 * @see https://github.com/wagmi-dev/wagmi/blob/main/packages/cli/src/plugins/foundry.ts
 */
export const getArtifactPathSync = (
  solFile: string,
  currentDirectory: string,
  config: Config,
  logger: Logger,
) => {
  const artifactsDirectory = join(currentDirectory, config.project, config.out)
  const files = globSync([`${artifactsDirectory}/**/${solFile}`])

  if (files.length > 1) {
    logger.warn(
      `More than one file found for ${solFile} in ${currentDirectory}.  This plugin handles that poorly atm`,
    )
  }

  if (files.length === 0) {
    logger.error(`No files found for ${solFile} in ${currentDirectory}`)
    throw new Error('No files found')
  }

  return files[0]
}