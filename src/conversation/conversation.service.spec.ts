import { Test, TestingModule } from '@nestjs/testing'
import { ConversationService } from './conversation.service'
import { getModelToken } from '@nestjs/mongoose'
import { PusherService } from 'src/pusher/pusher.service'
import { MessageService } from 'src/message/message.service'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { Types } from 'mongoose'
import { UserDocument } from 'src/user/schemas/user.schema'

describe('ConversationService', () => {
  let service: ConversationService

  const mockPusherService = {
    trigger: jest.fn(() => {
      return true
    })
  }

  const mockCloudinaryService = {
    destroyFile: jest.fn(() => {
      return true
    }),
    uploadFile: jest.fn(() => {
      return {
        secure_url: 'secure_url'
      }
    })
  }

  const mockMessageService = {
    createMessage: jest.fn()
  }

  const mockUserModel = {
    findOne: jest.fn(),
    find: jest.fn()
  }

  const mockConversationModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn()
  }

  const mockMessageModel = {
    findOneAndUpdate: jest.fn()
  }

  const file: Express.Multer.File = {
    fieldname: 'thumb',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1000,
    stream: null,
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.from('test')
  }

  const mockMessage = {
    _id: new Types.ObjectId('655f7423b014739c9499ab1a'),
    sender: {
      _id: new Types.ObjectId('655f73beb014739c9499ab11'),
      displayName: 'Kiyotaka Ayanokouji',
      firstName: 'Kiyotaka',
      lastName: 'Ayanokouji',
      email: 'email'
    },
    seenUsers: [new Types.ObjectId('655f9abcf065785776814967')],
    content: 'message content',
    createdAt: '2021-01-01T00:00:00.000Z'
  }

  const mockConversation = {
    _id: new Types.ObjectId('655f7423b014739c9499ab1a'),
    name: 'conversation name',
    thumb: 'thumb',
    isGroup: true,
    members: [
      new Types.ObjectId('655f73beb014739c9499ab11'),
      new Types.ObjectId('655f73eab014739c9499ab14')
    ],
    messages: [
      {
        _id: new Types.ObjectId('655f7423b014739c9499a56a'),
        sender: {
          _id: new Types.ObjectId('655f73beb014739c94996611'),
          displayName: 'Kiyotaka Ayanokouji',
          firstName: 'Kiyotaka',
          lastName: 'Ayanokouji',
          email: 'email'
        },
        images: [],
        seenUsers: [new Types.ObjectId('655f7423b01473339499ab1a')],
        content: 'message content',
        createdAt: '2021-01-01T00:00:00.000Z'
      },
      {
        _id: new Types.ObjectId('655f7423b014739c9499ab1a'),
        sender: {
          _id: new Types.ObjectId('655f73beb014739c9499ab11'),
          displayName: 'Kiyotaka Ayanokouji',
          firstName: 'Kiyotaka',
          lastName: 'Ayanokouji',
          email: 'email'
        },
        images: [],
        seenUsers: [new Types.ObjectId('655f7423b014739c9499ab1a')],
        content: 'message content',
        createdAt: '2021-01-01T00:00:00.000Z'
      }
    ],
    createdAt: '2021-01-01T00:00:00.000Z',
    updatedAt: '2021-01-01T00:00:00.000Z'
  }

  const mockUserData = {
    _id: new Types.ObjectId('655f7423b014739c9499ab1a'),
    displayName: 'Kiyotaka Ayanokouji',
    firstName: 'Kiyotaka',
    lastName: 'Ayanokouji',
    email: 'kiyotaka@gmail.com',
    avatar: null,
    accountType: 'local',
    status: 'not_verified',
    Role: 'user',
    friends: [
      new Types.ObjectId('655f73beb014739c9499ab11'),
      new Types.ObjectId('655f73eab014739c9499ab14')
    ],
    friendRequests: [],
    createdAt: '2023-11-23T15:47:47.775Z',
    updatedAt: '2023-11-23T16:21:12.696Z',
    __v: 0
  } as unknown as UserDocument

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: MessageService,
          useValue: mockMessageService
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService
        },
        {
          provide: getModelToken('User'),
          useValue: mockUserModel
        },
        {
          provide: getModelToken('Message'),
          useValue: mockMessageModel
        },
        {
          provide: getModelToken('Conversation'),
          useValue: mockConversationModel
        },
        {
          provide: PusherService,
          useValue: mockPusherService
        }
      ]
    }).compile()

    service = module.get<ConversationService>(ConversationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createConversation', () => {
    it('should create a group conversation', async () => {
      const createConvDto = {
        name: 'conversation name',
        members: ['objectid1', 'objectid2'],
        isGroup: true
      }

      jest.spyOn(mockConversationModel, 'create').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockConversation)
      })

      await expect(
        service.createConversation(mockUserData._id, createConvDto)
      ).resolves.toMatchObject(mockConversation)
    })

    it('should create a conversation with one member', async () => {
      const createConvDto = {
        name: 'conversation name',
        members: ['objectid1'],
        isGroup: false
      }

      jest.spyOn(mockConversationModel, 'create').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockConversation)
      })

      jest.spyOn(mockConversationModel, 'find').mockResolvedValue([])

      await expect(
        service.createConversation(mockUserData._id, createConvDto)
      ).resolves.toMatchObject(mockConversation)
    })

    it('should create a group conversation', async () => {
      const createConvDto = {
        name: 'conversation name',
        members: ['objectid1'],
        isGroup: true
      }

      jest.spyOn(mockConversationModel, 'create').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockConversation)
      })

      await expect(
        service.createConversation(mockUserData._id, createConvDto)
      ).rejects.toThrowError('Invalid data')
    })

    it('should create a conversation with one member error conversation existed', async () => {
      const createConvDto = {
        name: 'conversation name',
        members: ['objectid1'],
        isGroup: false
      }

      jest.spyOn(mockConversationModel, 'create').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockConversation)
      })

      jest.spyOn(mockConversationModel, 'find').mockResolvedValue([mockConversation])

      await expect(service.createConversation(mockUserData._id, createConvDto)).rejects.toThrow(
        'Conversation already exists'
      )
    })
  })

  describe('getConversationWithUserId', () => {
    it('should get conversation with user id success', async () => {
      jest.spyOn(mockConversationModel, 'find').mockReturnValue({
        lean: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([mockConversation])
              })
            })
          })
        })
      })

      await expect(service.getConversationWithUserId(mockUserData._id)).resolves.toMatchObject([
        mockConversation
      ])
    })
  })

  describe('getConversationWithId', () => {
    it('should get conversation with id success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockConversation)
          })
        })
      })

      await expect(
        service.getConversationWithId(mockUserData._id, mockConversation._id.toString())
      ).resolves.toMatchObject(mockConversation)
    })

    it('should get conversation with id success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
          })
        })
      })

      await expect(
        service.getConversationWithId(mockUserData._id, mockConversation._id.toString())
      ).rejects.toThrow('Invalid conversation or permission denied')
    })
  })

  describe('seenConversation', () => {
    it('should seen conversation error invalid conversation', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      })

      await expect(
        service.seenConversation(mockUserData._id, mockConversation._id.toString())
      ).rejects.toThrow('Invalid conversation')
    })

    it('should seen conversation true not found lastmessage', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockConversation,
            messages: []
          })
        })
      })

      await expect(
        service.seenConversation(mockUserData._id, mockConversation._id.toString())
      ).resolves.toEqual(true)
    })

    it('should seen conversation true not found lastmessage', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockConversation)
        })
      })

      await expect(
        service.seenConversation(mockUserData._id, mockConversation._id.toString())
      ).resolves.toEqual(true)
    })

    it('should seen conversation true not found lastmessage', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockConversation,
            messages: [
              {
                ...mockMessage
              }
            ]
          })
        })
      })

      jest.spyOn(mockMessageModel, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              ...mockMessage
            })
          })
        })
      })

      await expect(
        service.seenConversation(mockUserData._id, mockConversation._id.toString())
      ).resolves.toEqual(true)
    })
  })

  describe('updateConversationThumb', () => {
    it('should update conversation thumb error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue(null)

      await expect(
        service.updateThumb(mockConversation._id.toString(), mockUserData._id, file)
      ).rejects.toThrow('Invalid conversation or permission denied')
    })

    it('should update conversation thumb error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        ...mockConversation,
        isGroup: false
      })

      await expect(
        service.updateThumb(mockConversation._id.toString(), mockUserData._id, file)
      ).rejects.toThrow('Invalid conversation')
    })

    it('should update conversation thumb success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        updateOne: jest.fn().mockResolvedValueOnce(true)
      })

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue(true)

      await expect(
        service.updateThumb(mockConversation._id.toString(), mockUserData._id, file)
      ).resolves.toEqual(true)
    })

    it('should update conversation thumb success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        thumb: null,
        updateOne: jest.fn().mockResolvedValueOnce(true)
      })

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue(true)

      await expect(
        service.updateThumb(mockConversation._id.toString(), mockUserData._id, file)
      ).resolves.toEqual(true)
    })
  })

  describe('updateConversationInfo', () => {
    it('should update conversation info error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue(null)

      await expect(
        service.updateInfo(mockConversation._id.toString(), mockUserData._id, {
          name: 'conversation name'
        })
      ).rejects.toThrow('Invalid conversation or permission denied')
    })

    it('should update conversation info error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        ...mockConversation,
        isGroup: false
      })

      await expect(
        service.updateInfo(mockConversation._id.toString(), mockUserData._id, {
          name: 'conversation name'
        })
      ).rejects.toThrow('Invalid conversation')
    })

    it('should update conversation info success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        updateOne: jest.fn().mockResolvedValueOnce(true)
      })

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue(true)

      await expect(
        service.updateInfo(mockConversation._id.toString(), mockUserData._id, {
          name: 'conversation name'
        })
      ).resolves.toEqual(true)
    })
  })

  describe('addMembers', () => {
    const mockConversation = {
      _id: new Types.ObjectId('655f7423b014739c9499ab1a'),
      name: 'conversation name',
      thumb: 'thumb',
      isGroup: true,
      members: [
        new Types.ObjectId('655f73beb014739c9499ab11'),
        new Types.ObjectId('655f73eab014739c9499ab14')
      ],
      messages: [
        {
          _id: new Types.ObjectId('655f7423b014739c9499a56a'),
          sender: {
            _id: new Types.ObjectId('655f73beb014739c94996611'),
            displayName: 'Kiyotaka Ayanokouji',
            firstName: 'Kiyotaka',
            lastName: 'Ayanokouji',
            email: 'email'
          },
          images: [],
          seenUsers: [new Types.ObjectId('655f7423b01473339499ab1a')],
          content: 'message content',
          createdAt: '2021-01-01T00:00:00.000Z'
        },
        {
          _id: new Types.ObjectId('655f7423b014739c9499ab1a'),
          sender: {
            _id: new Types.ObjectId('655f73beb014739c9499ab11'),
            displayName: 'Kiyotaka Ayanokouji',
            firstName: 'Kiyotaka',
            lastName: 'Ayanokouji',
            email: 'email'
          },
          images: [],
          seenUsers: [new Types.ObjectId('655f7423b014739c9499ab1a')],
          content: 'message content',
          createdAt: '2021-01-01T00:00:00.000Z'
        }
      ],
      createdAt: '2021-01-01T00:00:00.000Z',
      updatedAt: '2021-01-01T00:00:00.000Z'
    }
    it('should add members error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          populate: jest.fn().mockResolvedValueOnce(null)
        })
      })

      jest.spyOn(mockUserModel, 'find').mockResolvedValueOnce([mockUserData])

      await expect(
        service.addMembers(mockConversation._id.toString(), mockUserData._id, [
          '65735fe392fbdfd4575aa73d'
        ])
      ).rejects.toThrow('Invalid conversation or permission denied')
    })

    it('should add members error', async () => {
      await expect(
        service.addMembers(mockConversation._id.toString(), mockUserData._id, [
          '65735fe392fbdfd4575aa73d',
          mockUserData._id.toString()
        ])
      ).rejects.toThrow('Invalid input')
    })

    it('should add members error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          populate: jest.fn().mockResolvedValueOnce({
            ...mockConversation,
            isGroup: false
          })
        })
      })

      jest.spyOn(mockUserModel, 'find').mockResolvedValueOnce([mockUserData])

      await expect(
        service.addMembers(mockConversation._id.toString(), mockUserData._id, [
          '65735fe392fbdfd4575aa73d'
        ])
      ).rejects.toThrow('Invalid conversation')
    })

    it('should add members error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          populate: jest.fn().mockResolvedValueOnce({
            ...mockConversation
          })
        })
      })

      jest.spyOn(mockUserModel, 'find').mockResolvedValueOnce([mockUserData])

      await expect(
        service.addMembers(mockConversation._id.toString(), mockUserData._id, [
          '655f73beb014739c9499ab11'
        ])
      ).rejects.toThrow('Invalid input')
    })

    it('should add members success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            ...mockConversation,
            updateOne: jest.fn().mockResolvedValue(true)
          })
        })
      })

      jest.spyOn(mockUserModel, 'find').mockResolvedValueOnce([mockUserData])

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue(true)

      await expect(
        service.addMembers(mockConversation._id.toString(), mockUserData._id, [
          '655f73beb014739c9499ab11',
          '6571a154650f6943af49dd68'
        ])
      ).resolves.toEqual(true)
    })
  })

  describe('removeMembers', () => {
    const memberId = '656e26e021c1d294c66ea1d0'
    it('should remove members error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce(null)

      jest.spyOn(mockUserModel, 'findOne').mockResolvedValue({
        ...mockUserData
      })

      await expect(
        service.removeMembers(mockConversation._id.toString(), mockUserData._id, memberId)
      ).rejects.toThrow('Invalid conversation or permission')
    })

    it('should remove members error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        isGroup: false
      })

      jest.spyOn(mockUserModel, 'findOne').mockResolvedValue({
        ...mockUserData
      })

      await expect(
        service.removeMembers(mockConversation._id.toString(), mockUserData._id, memberId)
      ).rejects.toThrow('Invalid conversation')
    })

    it('should remove members error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        admins: [new Types.ObjectId('655f7423b014739c9499ab1a')]
      })

      jest.spyOn(mockUserModel, 'findOne').mockResolvedValue({
        ...mockUserData
      })

      await expect(
        service.removeMembers(
          mockConversation._id.toString(),
          mockUserData._id,
          '655f7423b014739c9499ab1a'
        )
      ).rejects.toThrow('Cannot remove admin')
    })

    it('should remove members success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        members: [
          new Types.ObjectId('655f73beb014739c9499ab11'),
          new Types.ObjectId('655f73eab014739c9499ab14'),
          new Types.ObjectId(memberId)
        ],
        admins: [new Types.ObjectId('655f7423b014739c9499ab1a')],
        updateOne: jest.fn().mockResolvedValueOnce(true)
      })

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValueOnce(true)

      await expect(
        service.removeMembers(mockConversation._id.toString(), mockUserData._id, memberId)
      ).resolves.toEqual(true)
    })

    it('should remove members success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        admins: [new Types.ObjectId('655f7423b014739c9499ab1a')],
        updateOne: jest.fn().mockResolvedValue(null)
      })

      jest.spyOn(mockUserModel, 'findOne').mockResolvedValueOnce({
        ...mockUserData
      })

      await expect(
        service.removeMembers(mockConversation._id.toString(), mockUserData._id, memberId)
      ).resolves.toEqual(true)
    })
  })

  describe('leaveConversation', () => {
    it('should leave conversation error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce(null)

      await expect(
        service.leaveConversation(mockConversation._id.toString(), mockUserData._id)
      ).rejects.toThrow('Invalid conversation')
    })

    it('should leave conversation error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        isGroup: false
      })

      await expect(
        service.leaveConversation(mockConversation._id.toString(), mockUserData._id)
      ).rejects.toThrow('Invalid conversation')
    })

    it('should leave conversation error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        admins: [new Types.ObjectId('655f7423b014739c9499ab1a')],
        updateOne: jest.fn().mockResolvedValueOnce(true)
      })

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue(true)

      await expect(
        service.leaveConversation(mockConversation._id.toString(), mockUserData._id)
      ).rejects.toThrow('Cannot leave conversation')
    })

    it('should leave conversation success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        admins: [new Types.ObjectId('655f7423b014739c9499ab11')],
        updateOne: jest.fn().mockResolvedValueOnce(null)
      })

      await expect(
        service.leaveConversation(mockConversation._id.toString(), mockUserData._id)
      ).resolves.toEqual(true)
    })

    it('should leave conversation success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        admins: [new Types.ObjectId('655f7423b014739c9499ab11')],
        updateOne: jest.fn().mockResolvedValueOnce(true)
      })

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue(true)

      await expect(
        service.leaveConversation(mockConversation._id.toString(), mockUserData._id)
      ).resolves.toEqual(true)
    })

    it('should leave conversation success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        members: [
          new Types.ObjectId('655f73beb014739c9499ab11'),
          new Types.ObjectId('655f73eab014739c9499ab14'),
          mockUserData._id
        ],
        admins: [new Types.ObjectId('655f7423b014739c9499ab11')],
        updateOne: jest.fn().mockResolvedValueOnce(true)
      })

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue(true)

      await expect(
        service.leaveConversation(mockConversation._id.toString(), mockUserData._id)
      ).resolves.toEqual(true)
    })
  })

  describe('addAdmins', () => {
    it('should add admins success', async () => {
      await expect(
        service.addAdmins(
          mockConversation._id.toString(),
          mockUserData._id,
          '655f7423b014739c9499ab1a'
        )
      ).rejects.toThrow('Cannot add yourself')
    })

    it('should add admin error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce(null)

      await expect(
        service.addAdmins(
          mockConversation._id.toString(),
          mockUserData._id,
          '655f7423b014739c9499ab14'
        )
      ).rejects.toThrow('Invalid conversation or permission denied')
    })

    it('should add admin error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        isGroup: false
      })

      await expect(
        service.addAdmins(
          mockConversation._id.toString(),
          mockUserData._id,
          '655f7423b014739c9499ab15'
        )
      ).rejects.toThrow('Invalid conversation')
    })

    it('should add admin error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        admins: [new Types.ObjectId('655f7423b014739c9499ab15')]
      })

      await expect(
        service.addAdmins(
          mockConversation._id.toString(),
          mockUserData._id,
          '655f7423b014739c9499ab15'
        )
      ).rejects.toThrow('User is already an admin')
    })

    it('should add admin success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValueOnce({
        ...mockConversation,
        admins: [new Types.ObjectId('655f7423b014739c9499ab15')],
        updateOne: jest.fn().mockResolvedValueOnce(true)
      })

      jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue(true)

      await expect(
        service.addAdmins(
          mockConversation._id.toString(),
          mockUserData._id,
          '655f7423b014739c9499ab16'
        )
      ).resolves.toEqual(true)
    })
  })

  describe('getAllImages', () => {
    it('should get all images error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      })

      await expect(
        service.getAllImages(mockConversation._id.toString(), mockUserData._id)
      ).rejects.toThrow('Invalid conversation or permission denied')
    })

    it('should get all images success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockConversation)
        })
      })

      await expect(
        service.getAllImages(mockConversation._id.toString(), mockUserData._id)
      ).resolves.toMatchObject([])
    })

    it('should get all images success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockConversation,
            messages: [
              {
                _id: new Types.ObjectId('655f7423b014739c9499a56a'),
                sender: {
                  _id: new Types.ObjectId('655f73beb014739c94996611'),
                  displayName: 'Kiyotaka Ayanokouji',
                  firstName: 'Kiyotaka',
                  lastName: 'Ayanokouji',
                  email: 'email'
                },
                images: ['image1'],
                seenUsers: [new Types.ObjectId('655f7423b01473339499ab1a')],
                content: 'message https://thinhnguyen.live content',
                createdAt: '2021-01-01T00:00:00.000Z'
              }
            ]
          })
        })
      })

      await expect(
        service.getAllImages(mockConversation._id.toString(), mockUserData._id)
      ).resolves.toMatchObject([
        {
          messageId: '655f7423b014739c9499a56a',
          sender: {
            _id: new Types.ObjectId('655f73beb014739c94996611'),
            displayName: 'Kiyotaka Ayanokouji',
            firstName: 'Kiyotaka',
            lastName: 'Ayanokouji',
            email: 'email'
          },
          image: 'image1',
          createdAt: '2021-01-01T00:00:00.000Z'
        }
      ])
    })
  })

  describe('getAllLinks', () => {
    it('should get all links error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      })

      await expect(
        service.getAllLinks(mockConversation._id.toString(), mockUserData._id)
      ).rejects.toThrow('Invalid conversation or permission denied')
    })

    it('should get all links success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockConversation)
        })
      })

      await expect(
        service.getAllLinks(mockConversation._id.toString(), mockUserData._id)
      ).resolves.toMatchObject([])
    })

    it('should get all links success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockConversation,
            messages: [
              {
                _id: new Types.ObjectId('655f7423b014739c9499a56a'),
                sender: {
                  _id: new Types.ObjectId('655f73beb014739c94996611'),
                  displayName: 'Kiyotaka Ayanokouji',
                  firstName: 'Kiyotaka',
                  lastName: 'Ayanokouji',
                  email: 'email'
                },
                images: ['image1'],
                seenUsers: [new Types.ObjectId('655f7423b01473339499ab1a')],
                content: 'message https://thinhnguyen.live content',
                createdAt: '2021-01-01T00:00:00.000Z'
              }
            ]
          })
        })
      })

      await expect(
        service.getAllLinks(mockConversation._id.toString(), mockUserData._id)
      ).resolves.toMatchObject([
        {
          messageId: '655f7423b014739c9499a56a',
          sender: {
            _id: new Types.ObjectId('655f73beb014739c94996611'),
            displayName: 'Kiyotaka Ayanokouji',
            firstName: 'Kiyotaka',
            lastName: 'Ayanokouji',
            email: 'email'
          },
          link: 'https://thinhnguyen.live',
          createdAt: '2021-01-01T00:00:00.000Z'
        }
      ])
    })
  })

  describe('search', () => {
    it('should search conversation success', async () => {
      jest.spyOn(mockConversationModel, 'find').mockReturnValue([mockConversation])

      await expect(service.search(mockUserData._id, 'conversation')).resolves.toMatchObject([
        mockConversation
      ])
    })
  })
})
