/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing'
import { ConversationController } from './conversation.controller'
import { ConversationService } from './conversation.service'
import { AccountType, Role, Status, UserDocument } from 'src/user/schemas/user.schema'
import { Types } from 'mongoose'

describe('ConversationController', () => {
  let controller: ConversationController

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

  const mockConversation = {
    _id: new Types.ObjectId('655f7423b014739c9499ab1a'),
    name: 'conversation name',
    members: [
      new Types.ObjectId('655f73beb014739c9499ab11'),
      new Types.ObjectId('655f73eab014739c9499ab14')
    ],
    messages: [
      {
        _id: new Types.ObjectId('655f7423b014739c9499ab1a'),
        sender: new Types.ObjectId('655f73beb014739c9499ab11'),
        content: 'message content',
        createdAt: '2021-01-01T00:00:00.000Z'
      }
    ],
    createdAt: '2021-01-01T00:00:00.000Z',
    updatedAt: '2021-01-01T00:00:00.000Z'
  }

  const mockConversationService = {
    createConversation: jest.fn((userId, createConvDto) => {
      return {
        _id: 'objectid',
        ...createConvDto
      }
    }),
    getConversationWithUserId: jest.fn(userId => {
      return [mockConversation]
    }),
    getConversationWithId: jest.fn((userId, conversationId) => {
      return mockConversation
    }),
    seenConversation: jest.fn((userId, conversationId) => {
      return {}
    }),
    updateThumb: jest.fn((conversationId, userId, file) => {
      return {}
    }),
    updateInfo: jest.fn((conversationId, userId, updateInfoDto) => {
      return {}
    }),
    addMembers: jest.fn((conversationId, userId, addMembersDto) => {
      return {}
    }),
    removeMembers: jest.fn((conversationId, userId, removeMembersDto) => {
      return {}
    }),
    leaveConversation: jest.fn((conversationId, userId) => {
      return {}
    }),
    addAdmins: jest.fn((conversationId, userId, addAdminsDto) => {
      return {}
    }),
    getAllImages: jest.fn((conversationId, userId) => {
      return [
        {
          _id: 'objectid',
          sender: 'objectid',
          content: 'message content',
          createdAt: '2021-01-01T00:00:00.000Z'
        }
      ]
    }),
    getAllLinks: jest.fn((conversationId, userId) => {
      return [
        {
          _id: 'objectid',
          sender: 'objectid',
          content: 'message content',
          createdAt: '2021-01-01T00:00:00.000Z'
        }
      ]
    })
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [ConversationService]
    })
      .overrideProvider(ConversationService)
      .useValue(mockConversationService)
      .compile()

    controller = app.get<ConversationController>(ConversationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should create conversation success', async () => {
    const createConvDto = {
      name: 'conversation name',
      members: ['objectid', 'objectid'],
      isGroup: true
    }

    expect(await controller.createConversation(mockUserData, createConvDto)).toMatchObject({
      success: true,
      message: 'Conversation created successfully',
      metadata: {
        _id: 'objectid',
        ...createConvDto
      }
    })
  })

  it('should get conversation with user id success', async () => {
    expect(await controller.getConversationWithUserId(mockUserData)).toMatchObject({
      success: true,
      message: 'Conversation fetched successfully',
      metadata: [mockConversation]
    })
  })

  it('should get conversation with id success', async () => {
    const conversationId = 'objectid'

    expect(await controller.getConversationWithId(mockUserData, { conversationId })).toMatchObject({
      success: true,
      message: 'Conversation fetched successfully',
      metadata: mockConversation
    })
  })

  it('should seen conversation success', async () => {
    const conversationId = 'objectid'

    expect(await controller.seenConversation(mockUserData, { conversationId })).toMatchObject({
      success: true,
      message: 'Conversation seen'
    })
  })

  it('should upload thumb success', async () => {
    const conversationId = 'objectid'
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

    expect(
      await controller.uploadThumb({ conversationId }, { user: mockUserData }, file)
    ).toMatchObject({
      success: true,
      message: 'Upload avatar successfully'
    })
  })

  it('should upload thumb error validate fail', async () => {
    const conversationId = 'objectid'
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

    await expect(
      controller.uploadThumb(
        { conversationId },
        {
          user: mockUserData,
          fileValidationError: 'wrong extension type. Accepted file ext are: jpg, png, jpeg'
        },
        file
      )
    ).rejects.toThrow('wrong extension type. Accepted file ext are: jpg, png, jpeg')
  })

  it('should upload thumb error file notfound', async () => {
    const conversationId = 'objectid'

    await expect(
      controller.uploadThumb(
        { conversationId },
        {
          user: mockUserData
        },
        null
      )
    ).rejects.toThrow('File is required')
  })

  it('should update info success', async () => {
    const conversationId = 'objectid'
    const updateInfoDto = {
      name: 'conversation name',
      isGroup: true
    }

    expect(
      await controller.updateInfo({ conversationId }, mockUserData, updateInfoDto)
    ).toMatchObject({
      success: true,
      message: 'Update info successfully'
    })
  })

  it('should add members success', async () => {
    const conversationId = 'objectid'
    const addMembersDto = {
      members: ['objectid', 'objectid']
    }

    expect(
      await controller.addMembers({ conversationId }, mockUserData, addMembersDto)
    ).toMatchObject({
      success: true,
      message: 'Add members successfully'
    })
  })

  it('should remove members success', async () => {
    const conversationId = 'objectid'
    const removeMembersDto = {
      memberId: 'objectid'
    }

    expect(
      await controller.removeMembers({ conversationId }, mockUserData, removeMembersDto)
    ).toMatchObject({
      success: true,
      message: 'Remove members successfully'
    })
  })

  it('should leave conversation success', async () => {
    const conversationId = 'objectid'

    expect(await controller.leaveConversation({ conversationId }, mockUserData)).toMatchObject({
      success: true,
      message: 'Leave conversation successfully'
    })
  })

  it('should add admins success', async () => {
    const conversationId = 'objectid'
    const addAdminsDto = {
      memberId: 'objectid'
    }

    expect(
      await controller.addAdmins({ conversationId }, mockUserData, addAdminsDto)
    ).toMatchObject({
      success: true,
      message: 'Add admins successfully'
    })
  })

  it('should get all images success', async () => {
    const conversationId = 'objectid'

    expect(await controller.getAllImages({ conversationId }, mockUserData)).toMatchObject({
      success: true,
      message: 'Get all images successfully',
      metadata: [
        {
          _id: 'objectid',
          sender: 'objectid',
          content: 'message content',
          createdAt: '2021-01-01T00:00:00.000Z'
        }
      ]
    })
  })

  it('should get all links success', async () => {
    const conversationId = 'objectid'

    expect(await controller.getAllLinks({ conversationId }, mockUserData)).toMatchObject({
      success: true,
      message: 'Get all links successfully',
      metadata: [
        {
          _id: 'objectid',
          sender: 'objectid',
          content: 'message content',
          createdAt: '2021-01-01T00:00:00.000Z'
        }
      ]
    })
  })
})
