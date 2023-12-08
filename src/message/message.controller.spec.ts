import { UserDocument } from 'src/user/schemas/user.schema'
import { MessageController } from './message.controller'
import { Types } from 'mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { MessageService } from './message.service'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'

describe('MessageController', () => {
  let controller: MessageController

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

  const mockMessageService = {
    createMessage: jest.fn(),
    typingMessage: jest.fn().mockResolvedValue(true),
    getAllMessages: jest.fn().mockResolvedValue([]),
    getMessages: jest.fn().mockResolvedValue([]),
    getMessagesRange: jest.fn().mockResolvedValue([]),
    search: jest.fn().mockResolvedValue([])
  }

  const mockCloudinaryService = {
    uploadFile: jest.fn().mockReturnValue({
      secure_url: 'secure_url'
    })
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        {
          provide: MessageService,
          useValue: mockMessageService
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService
        }
      ]
    }).compile()

    controller = app.get<MessageController>(MessageController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should newMessage error', async () => {
    await expect(
      controller.newMessage(
        {
          fileValidationError: 'error'
        },
        mockUserData,
        {
          conversationId: '655f7423b014739c9499ab1a',
          content: 'test'
        },
        [file]
      )
    ).rejects.toThrow('error')
  })
  it('should newMessage with images success', async () => {
    const newMessageDto = {
      conversationId: '655f7423b014739c9499ab1a',
      content: 'test'
    }
    jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue({
      ...newMessageDto
    })

    await expect(
      controller.newMessage({}, mockUserData, newMessageDto, [file])
    ).resolves.toMatchObject({
      success: true,
      message: 'Message sent successfully',
      metadata: {
        ...newMessageDto
      }
    })
  })

  it('should newMessage success', async () => {
    const newMessageDto = {
      conversationId: '655f7423b014739c9499ab1a',
      content: 'test'
    }
    jest.spyOn(mockMessageService, 'createMessage').mockResolvedValue({
      ...newMessageDto
    })

    await expect(
      controller.newMessage({}, mockUserData, newMessageDto, null)
    ).resolves.toMatchObject({
      success: true,
      message: 'Message sent successfully',
      metadata: {
        ...newMessageDto
      }
    })
  })

  it('should typingMessage success', async () => {
    await expect(
      controller.typingMessage(mockUserData, {
        conversationId: '655f7423b014739c9499ab1a'
      })
    ).resolves.toMatchObject({
      success: true,
      message: 'Typingggg'
    })
  })

  it('should getAllMessages success', async () => {
    const conversationId = '655f7423b014739c9499ab1a'

    await expect(
      controller.getAllMessages(mockUserData, {
        conversationId
      })
    ).resolves.toMatchObject({
      success: true,
      message: 'Messages fetched successfully',
      metadata: []
    })
  })

  it('should getMessages success', async () => {
    const conversationId = '655f7423b014739c9499ab1a'

    await expect(
      controller.getMessages('next', 'limit', mockUserData, {
        conversationId
      })
    ).resolves.toMatchObject({
      success: true,
      message: 'Messages fetched successfully',
      metadata: []
    })
  })

  it('should getMessages success', async () => {
    const conversationId = '655f7423b014739c9499ab1a'

    await expect(
      controller.getMessages('next', null, mockUserData, {
        conversationId
      })
    ).resolves.toMatchObject({
      success: true,
      message: 'Messages fetched successfully',
      metadata: []
    })
  })

  it('should getMessagesRange success', async () => {
    const conversationId = '655f7423b014739c9499ab1a'

    await expect(
      controller.getMessagesRange(mockUserData, 'messid', 'range', {
        conversationId
      })
    ).resolves.toMatchObject({
      success: true,
      message: 'Messages fetched successfully',
      metadata: []
    })
  })

  it('should getMessagesRange success', async () => {
    const conversationId = '655f7423b014739c9499ab1a'

    await expect(
      controller.getMessagesRange(mockUserData, 'messid', null, {
        conversationId
      })
    ).resolves.toMatchObject({
      success: true,
      message: 'Messages fetched successfully',
      metadata: []
    })
  })

  it('should searchMessages success', async () => {
    const conversationId = '655f7423b014739c9499ab1a'

    await expect(
      controller.search(
        'keyword',
        mockUserData,
        {
          conversationId
        },
        'range',
        'next'
      )
    ).resolves.toMatchObject({
      success: true,
      message: 'Search message successfully',
      metadata: []
    })
  })

  it('should searchMessages success', async () => {
    const conversationId = '655f7423b014739c9499ab1a'

    await expect(
      controller.search(
        'keyword',
        mockUserData,
        {
          conversationId
        },
        null,
        'next'
      )
    ).resolves.toMatchObject({
      success: true,
      message: 'Search message successfully',
      metadata: []
    })
  })
})
