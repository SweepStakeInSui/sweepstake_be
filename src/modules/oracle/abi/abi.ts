export const abi = [
    {
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'NotAdmin',
        type: 'error',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'admin',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'newAdminAddress',
                type: 'address',
            },
        ],
        name: 'NewAdmin',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'questionID',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'bytes',
                name: 'ancillaryData',
                type: 'bytes',
            },
        ],
        name: 'QuestionInitialized',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'admin',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'removedAdmin',
                type: 'address',
            },
        ],
        name: 'RemovedAdmin',
        type: 'event',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'admin',
                type: 'address',
            },
        ],
        name: 'addAdmin',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'admins',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'questionID',
                type: 'bytes32',
            },
        ],
        name: 'getSateData',
        outputs: [
            {
                internalType: 'enum IOptimisticOracleV2.State',
                name: '',
                type: 'uint8',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'questionID',
                type: 'bytes32',
            },
        ],
        name: 'getSettledData',
        outputs: [
            {
                internalType: 'int256',
                name: '',
                type: 'int256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'addr',
                type: 'address',
            },
        ],
        name: 'isAdmin',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'liveness',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        name: 'questions',
        outputs: [
            {
                internalType: 'string',
                name: 'creator',
                type: 'string',
            },
            {
                internalType: 'string',
                name: 'marketID',
                type: 'string',
            },
            {
                internalType: 'bytes',
                name: 'ancillaryData',
                type: 'bytes',
            },
            {
                internalType: 'bool',
                name: 'resolved',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'admin',
                type: 'address',
            },
        ],
        name: 'removeAdmin',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'renounceAdmin',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: 'creator',
                type: 'string',
            },
            {
                internalType: 'string',
                name: 'marketID',
                type: 'string',
            },
            {
                internalType: 'string',
                name: 'ancillaryString',
                type: 'string',
            },
        ],
        name: 'requestData',
        outputs: [
            {
                internalType: 'bytes32',
                name: 'questionID',
                type: 'bytes32',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_liveness',
                type: 'uint256',
            },
        ],
        name: 'setLiveness',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'questionID',
                type: 'bytes32',
            },
        ],
        name: 'settleRequest',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;
