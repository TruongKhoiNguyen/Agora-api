import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'
import mongoose from 'mongoose'

@ValidatorConstraint({ name: 'customText', async: false })
export class IsObjectId implements ValidatorConstraintInterface {
  validate(text: string) {
    return mongoose.Types.ObjectId.isValid(text) // for async validations you must return a Promise<boolean> here
  }

  defaultMessage() {
    // here you can provide default error message if validation failed
    return 'Invalid ObjectId'
  }
}
