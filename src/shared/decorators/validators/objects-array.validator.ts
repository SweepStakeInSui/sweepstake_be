import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

export function IsObjectsArray(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isObjectsArray',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate(value: any[]) {
                    if (value.length) {
                        for (let index = 0; index < value.length; index++) {
                            const element = value[index];
                            if (element.length) {
                                return false;
                            }
                        }
                    }
                    return true;
                },
                defaultMessage: (args?: ValidationArguments) => {
                    return `${args.property} must be an array of objects, not nested array!`;
                },
            },
        });
    };
}
