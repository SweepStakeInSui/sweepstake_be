import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';
import { ethers } from 'ethers';

export function IsSuiAddress(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsSuiAddress',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                validate(value: string) {
                    // TODO: Implement SUI address validation
                    return true;
                },
                defaultMessage: (args?: ValidationArguments) => {
                    return `${args.property} must be a sui address!`;
                },
            },
        });
    };
}

export function IsEthereumChecksumAddress(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsEthereumChecksumAddress',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate(value: string) {
                    try {
                        ethers.getAddress(value);
                    } catch (err) {
                        return false;
                    }
                    return true;
                },
                defaultMessage: (args?: ValidationArguments) => {
                    return `${args.property} must be a checksum address!`;
                },
            },
        });
    };
}
