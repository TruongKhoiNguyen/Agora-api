import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { getModelToken } from '@nestjs/mongoose'
import { User } from './schemas/user.schema'
import { Types } from 'mongoose'
import { PusherService } from 'src/pusher/pusher.service'
describe('UserService', () => {
  let service: UserService
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

  const mockUserModel = {
    find: jest.fn(),
    updateOne: jest.fn()
  }

  const mockPusherService = {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel
        },
        {
          provide: PusherService,
          useValue: mockPusherService
        }
      ]
    }).compile()

    service = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // test getAllUser
  describe('getAllUser', () => {
    it('should return an array of users', async () => {
      jest.spyOn(mockUserModel, 'find').mockResolvedValue(mockUsersData)
      expect(await service.getAllUser()).toBe(mockUsersData)
    })
  })

  // test updateAvatar
  describe('updateAvatar', () => {
    it('should return success update avatar', async () => {
      jest.spyOn(mockUserModel, 'updateOne').mockResolvedValue({
        acknowledged: true,
        modifiedCount: 1
      })
      expect(
        await service.updateAvatar(new Types.ObjectId('652276aa4268d57ef67b9d7b'), 'avatar_url')
      ).toMatchObject({
        acknowledged: true,
        modifiedCount: 1
      })
    })
  })
})
