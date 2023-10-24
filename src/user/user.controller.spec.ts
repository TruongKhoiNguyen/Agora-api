import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { BadRequestException } from '@nestjs/common'

describe('UserController', () => {
  let controller: UserController
  const mockUsersData = [
    {
      _id: 'objectid1',
      email: 'test1@gmail.com'
    },
    {
      _id: 'objectid2',
      email: 'test2@gmail.com'
    }
  ]
  const mockMulterFile: Express.Multer.File = {
    fieldname: 'avatar',
    originalname: 'avatar.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 100000,
    destination: 'uploads/avatars',
    filename: '1619114476169-avatar.png',
    path: 'uploads/avatars/1619114476169-avatar.png',
    buffer: Buffer.from(''),
    stream: null
  }

  const mockUserService = {
    getAllUser: jest.fn(),
    updateAvatar: jest.fn()
  }
  const mockCloudinaryService = {
    uploadFile: jest.fn(),
    destroyFile: jest.fn()
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService
        }
      ]
    }).compile()

    controller = app.get<UserController>(UserController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getAllUser', () => {
    jest.spyOn(mockUserService, 'getAllUser').mockResolvedValue(mockUsersData)
    it('should return an array of users', async () => {
      expect(await controller.getAllUser()).toMatchObject(mockUsersData)
    })
  })

  describe('uploadAvatar', () => {
    jest.spyOn(mockCloudinaryService, 'uploadFile').mockResolvedValue({
      url: 'image-url'
    })

    jest.spyOn(mockCloudinaryService, 'destroyFile').mockResolvedValue({
      result: 'ok'
    })

    jest.spyOn(mockUserService, 'updateAvatar').mockResolvedValue({
      result: 'ok'
    })

    it('should return success message', async () => {
      const mockReq = {
        user: {
          _id: 'objectid',
          avatar: 'image-url'
        }
      }

      expect(await controller.uploadAvatar(mockReq, mockMulterFile)).toMatchObject({
        success: true,
        message: 'Upload avatar successfully'
      })
    })

    it('should return validation false', async () => {
      const mockReq = {
        user: {
          _id: 'objectid',
          avatar: 'image-url'
        },
        fileValidationError: 'wrong extension type. Accepted file ext are: jpg, png, jpeg'
      }

      try {
        await controller.uploadAvatar(mockReq, mockMulterFile)
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException)
        expect(err.message).toEqual(mockReq.fileValidationError)
      }
    })

    it('should return file not found exception', async () => {
      const mockReq = {
        user: {
          _id: 'objectid',
          avatar: 'image-url'
        }
      }

      try {
        await controller.uploadAvatar(mockReq, null)
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException)
        expect(err.message).toEqual('File is required')
      }
    })
  })
})
