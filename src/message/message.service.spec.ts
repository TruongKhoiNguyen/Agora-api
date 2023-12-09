import { Types } from 'mongoose'
import { MessageService } from './message.service'
import { UserDocument } from 'src/user/schemas/user.schema'
import { Test, TestingModule } from '@nestjs/testing'
import { PusherService } from 'src/pusher/pusher.service'
import { getModelToken } from '@nestjs/mongoose'
import { MessageTypes } from './schemas/message.schema'

describe('MessageService', () => {
  let service: MessageService

  const mockPusherService = {
    trigger: jest.fn(() => {
      return true
    })
  }

  const mockConversationModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(() => {
      return true
    }),
    findById: jest.fn()
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
    messages: [],
    createdAt: '2021-01-01T00:00:00.000Z',
    updatedAt: '2021-01-01T00:00:00.000Z'
  }

  const mockMessageModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn()
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
        MessageService,
        {
          provide: PusherService,
          useValue: mockPusherService
        },
        {
          provide: getModelToken('Conversation'),
          useValue: mockConversationModel
        },
        {
          provide: getModelToken('Message'),
          useValue: mockMessageModel
        }
      ]
    }).compile()

    service = module.get<MessageService>(MessageService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createMessage', () => {
    it('should create message error', async () => {
      const newMessageDto = {
        conversationId: mockConversation._id.toString(),
        content: 'message content'
      }
      jest.spyOn(mockConversationModel, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue(null)
      })

      await expect(service.createMessage(mockUserData._id, newMessageDto)).rejects.toThrow(
        'Conversation not found'
      )
    })

    it('should create message error', async () => {
      const newMessageDto = {
        conversationId: mockConversation._id.toString(),
        content: null
      }
      jest.spyOn(mockConversationModel, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue(mockConversation)
      })

      await expect(service.createMessage(mockUserData._id, newMessageDto)).rejects.toThrow(
        'Content or images is required'
      )
    })

    it('should create message success', async () => {
      const newMessageDto = {
        conversationId: mockConversation._id.toString(),
        content: 'message content'
      }

      jest.spyOn(mockConversationModel, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          ...mockConversation,
          updateOne: jest.fn(() => true)
        })
      })

      jest.spyOn(mockMessageModel, 'create').mockResolvedValue({
        populate: jest.fn().mockResolvedValue(mockMessage)
      })

      await expect(service.createMessage(mockUserData._id, newMessageDto)).resolves.toMatchObject(
        mockMessage
      )
    })

    it('should create message success', async () => {
      const newMessageDto = {
        conversationId: mockConversation._id.toString(),
        content: 'message content'
      }

      jest.spyOn(mockConversationModel, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          ...mockConversation,
          updateOne: jest.fn(() => true)
        })
      })

      jest.spyOn(mockMessageModel, 'create').mockResolvedValue({
        populate: jest.fn().mockResolvedValue(mockMessage)
      })

      await expect(
        service.createMessage(mockUserData._id, newMessageDto, null, MessageTypes.UP_ADD_ADMIN)
      ).resolves.toMatchObject(mockMessage)
    })
  })

  describe('getAllMessages', () => {
    it('should get all messages error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue(null)

      await expect(
        service.getAllMessages(mockUserData._id, mockConversation._id.toString())
      ).rejects.toThrow('Conversation not found or you are not a member')
    })

    it('should get all messages success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue(mockConversation)
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue([mockMessage])
            })
          })
        })
      })

      await expect(
        service.getAllMessages(mockUserData._id, mockConversation._id.toString())
      ).resolves.toMatchObject([mockMessage])
    })
  })

  describe('getMessages', () => {
    it('should get messages error', async () => {
      await expect(
        service.getMessages(mockUserData._id, mockConversation._id.toString(), 'null', 10)
      ).rejects.toThrow('Invalid objectId')
    })
    it('should get messages error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue(null)

      await expect(
        service.getMessages(mockUserData._id, mockConversation._id.toString(), null, 10)
      ).rejects.toThrow('Conversation not found or you are not a member')
    })

    it('should get messages success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue(mockConversation)
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue([mockMessage])
            })
          })
        })
      })

      await expect(
        service.getMessages(mockUserData._id, mockConversation._id.toString(), null, 10)
      ).resolves.toMatchObject([mockMessage])
    })

    it('should get messages success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue(mockConversation)
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue([mockMessage])
            })
          })
        })
      })

      await expect(
        service.getMessages(
          mockUserData._id,
          mockConversation._id.toString(),
          '656e151fe4ccc0293c61dafb',
          10
        )
      ).resolves.toMatchObject([mockMessage])
    })
  })

  describe('typingMessage', () => {
    it('should typing message error', async () => {
      jest.spyOn(mockConversationModel, 'findById').mockReturnValue(null)

      await expect(
        service.typingMessage(mockUserData._id, mockConversation._id.toString())
      ).rejects.toThrow('Conversation not found')
    })

    it('should typing message success', async () => {
      jest.spyOn(mockConversationModel, 'findById').mockReturnValue({
        mockConversation
      })

      await expect(
        service.typingMessage(mockUserData._id, mockConversation._id.toString())
      ).resolves.toMatchObject({
        success: true,
        message: 'Typing event create successfully'
      })
    })
  })

  describe('getMessagesRange', () => {
    it('should get message with range error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue(null)

      jest.spyOn(mockMessageModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })

      await expect(
        service.getMessagesRange(
          mockUserData._id,
          mockMessage._id.toString(),
          mockConversation._id.toString(),
          10
        )
      ).rejects.toThrow('Invalid message')
    })

    it('should get message with range error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue(null)

      jest.spyOn(mockMessageModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockMessage)
      })

      await expect(
        service.getMessagesRange(
          mockUserData._id,
          mockMessage._id.toString(),
          mockConversation._id.toString(),
          10
        )
      ).rejects.toThrow('Conversation not found or you are not a member')
    })

    it('should get message with range success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockReturnValue(mockConversation)

      jest.spyOn(mockMessageModel, 'findOne').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockMessage)
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([mockMessage])
              })
            })
          })
        })
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockMessage])
            })
          })
        })
      })

      await expect(
        service.getMessagesRange(
          mockUserData._id,
          mockMessage._id.toString(),
          mockConversation._id.toString(),
          10
        )
      ).resolves.toMatchObject([mockMessage, mockMessage])
    })
  })

  describe('search', () => {
    it('should search error', async () => {
      await expect(
        service.search(mockUserData._id, 'query', mockConversation._id.toString(), 'next', 10)
      ).rejects.toThrow('Invalid objectId')
    })

    it('should typing message error', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockResolvedValueOnce(null)

      await expect(
        service.search(
          mockUserData._id,
          'query',
          mockConversation._id.toString(),
          '656e1685d7e323902a175571',
          10
        )
      ).rejects.toThrow('Conversation not found')
    })

    it('should typing message success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockResolvedValueOnce(mockConversation)

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue([mockMessage])
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([mockMessage])
                })
              })
            })
          })
        })
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      })

      await expect(
        service.search(
          mockUserData._id,
          'query',
          mockConversation._id.toString(),
          '656e1685d7e323902a175571',
          10
        )
      ).resolves.toMatchObject({
        messages: [mockMessage],
        total: 1
      })
    })

    it('should typing message success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockResolvedValueOnce(mockConversation)

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue([mockMessage])
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([mockMessage])
                })
              })
            })
          })
        })
      })

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      })

      await expect(
        service.search(mockUserData._id, 'query', mockConversation._id.toString(), null, 10)
      ).resolves.toMatchObject({
        messages: [mockMessage],
        total: 1
      })
    })

    it('should typing message success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockResolvedValueOnce(mockConversation)

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue([])
      })

      await expect(
        service.search(
          mockUserData._id,
          'query',
          mockConversation._id.toString(),
          '656e1685d7e323902a175571',
          10
        )
      ).resolves.toMatchObject({
        messages: [],
        total: 0
      })
    })

    it('should typing message success', async () => {
      jest.spyOn(mockConversationModel, 'findOne').mockResolvedValueOnce(mockConversation)

      jest.spyOn(mockMessageModel, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue([])
      })

      await expect(
        service.search(mockUserData._id, 'query', mockConversation._id.toString(), null, 10)
      ).resolves.toMatchObject({
        messages: [],
        total: 0
      })
    })
  })
})
