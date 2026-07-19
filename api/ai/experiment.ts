import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '@/api/cors'
import { getAuthUser } from '@/api/auth'
import { experimentGenerator } from '@/features/ai/ExperimentGenerator'
import { experimentValidator } from '@/features/ai/ExperimentValidator'
import type { ExperimentScenario, GenerationOptions } from '@/features/ai/ExperimentGenerator'

interface GenerateRequestBody {
  description: string
  options?: GenerationOptions
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return

  const authUser = getAuthUser(req)
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { description, options = {} } = (req.body ?? {}) as GenerateRequestBody

    // Validate request
    if (!description || typeof description !== 'string' || description.trim() === '') {
      res.status(400).json({ error: 'description is required and must be a non-empty string' })
      return
    }

    console.log('[ai/experiment] step=generate userId=%s description=%s', authUser.userId, description.slice(0, 100))

    // Generate experiment scenario
    const scenario = experimentGenerator.generateFromDescription(description, options)

    if (!scenario) {
      res.status(400).json({ error: 'Could not generate experiment from description' })
      return
    }

    // Validate the generated scenario
    const validation = experimentValidator.validate(scenario)

    console.log('[ai/experiment] step=validate valid=%s errors=%d warnings=%d', 
      validation.valid, validation.errors.length, validation.warnings.length)

    // Return the scenario with validation results
    res.status(200).json({
      scenario,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        suggestions: validation.suggestions,
      },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    const errStack = error instanceof Error ? error.stack : ''
    console.error(
      '[ai/experiment] step=catch error=%s stack=%s',
      errMsg,
      errStack?.slice(0, 500)
    )
    
    res.status(500).json({ error: 'Internal server error' })
  }
}
