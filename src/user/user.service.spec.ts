import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { getModelToken } from '@nestjs/mongoose'
import { User, UserDocument } from './schemas/user.schema'
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

  const mockUserModel = {
    find: jest.fn(),
    updateOne: jest.fn(),
    findById: jest.fn()
  }

  const mockPusherService = {
    trigger: jest.fn().mockReturnValue(true)
  }

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

  // test getCurrUser
  describe('getCurrUser', () => {
    it('should return an user', async () => {
      jest.spyOn(mockUserModel, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUserData)
        })
      })

      expect(await service.getCurrUser(mockUserData._id)).toBe(mockUserData)
    })

    it('should return an user', async () => {
      jest.spyOn(mockUserModel, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      })

      await expect(service.getCurrUser(mockUserData._id)).rejects.toThrow('User not found')
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

  // test search
  describe('search', () => {
    it('should return an array of users', async () => {
      jest.spyOn(mockUserModel, 'find').mockResolvedValueOnce(mockUsersData)
      jest.spyOn(mockUserModel, 'find').mockResolvedValueOnce(mockUsersData)
      expect(await service.search('test')).toMatchObject([...mockUsersData, ...mockUsersData])
    })
  })

  // test addFriend
  describe('addFriend', () => {
    it('should add friend error', async () => {
      const addFriendto = {
        userId: 'objectid1',
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null)

      await expect(service.addFriend(mockUserData, addFriendto)).rejects.toThrow('user not found')
    })

    it('should add friend error', async () => {
      const addFriendto = {
        userId: mockUserData._id.toString(),
        message: 'test'
      }

      await expect(service.addFriend(mockUserData, addFriendto)).rejects.toThrow('Invalid input')
    })

    it('should add friend error', async () => {
      const addFriendto = {
        userId: '655f73beb014739c9499ab11',
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData,
        friends: [new Types.ObjectId('655f73beb014739c9499ab11')]
      })

      await expect(service.addFriend(mockUserData, addFriendto)).rejects.toThrow(
        'Friend already exists'
      )
    })

    it('should add friend error', async () => {
      const addFriendto = {
        userId: '655f73beb014739c9499ab11',
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData
      })

      await expect(
        service.addFriend(
          {
            ...mockUserData,
            friends: [],
            friendRequests: [
              {
                sender: new Types.ObjectId('655f73beb014739c9499ab11')
              }
            ]
          } as unknown as UserDocument,
          addFriendto
        )
      ).rejects.toThrow('Friend request is pending acceptance')
    })

    it('should add friend error', async () => {
      const addFriendto = {
        userId: '655f73beb014739c9499ab11',
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData,
        friendRequests: [
          {
            sender: mockUserData._id
          }
        ]
      })

      await expect(
        service.addFriend(
          {
            ...mockUserData,
            friends: []
          } as unknown as UserDocument,
          addFriendto
        )
      ).rejects.toThrow('Friend request already sent')
    })

    it('should add friend success', async () => {
      const addFriendto = {
        userId: '655f73beb014739c9499ab11',
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData,
        updateOne: jest.fn().mockResolvedValue(true)
      })

      await expect(
        service.addFriend(
          {
            ...mockUserData,
            friends: []
          } as unknown as UserDocument,
          addFriendto
        )
      ).resolves.toEqual(true)
    })

    it('should add friend success', async () => {
      const addFriendto = {
        userId: '655f73beb014739c9499ab11',
        message: null
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData,
        updateOne: jest.fn().mockResolvedValue(true)
      })

      await expect(
        service.addFriend(
          {
            ...mockUserData,
            friends: []
          } as unknown as UserDocument,
          addFriendto
        )
      ).resolves.toEqual(true)
    })
  })

  // test acceptFriend
  describe('acceptFriend', () => {
    const mockFriendId = '656e26e021c1d294c66ea1d0'
    it('should accept friend error', async () => {
      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null)

      await expect(
        service.acceptFriend(mockUserData, {
          userId: mockUserData._id.toString()
        })
      ).rejects.toThrow('Invalid input')
    })

    it('should accept friend error', async () => {
      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null)

      await expect(
        service.acceptFriend(mockUserData, {
          userId: mockFriendId
        })
      ).rejects.toThrow('user not found')
    })

    it('should accept friend error', async () => {
      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(mockUserData)

      await expect(
        service.acceptFriend(mockUserData, {
          userId: mockFriendId
        })
      ).rejects.toThrow('Friend request not found')
    })

    it('should accept friend success', async () => {
      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(mockFriendId),
        ...mockUserData,
        friends: [],
        updateOne: jest.fn().mockResolvedValue(true)
      })

      await expect(
        service.acceptFriend(
          {
            ...mockUserData,
            friendRequests: [
              {
                sender: new Types.ObjectId(mockFriendId)
              }
            ],
            updateOne: jest.fn().mockResolvedValue(true)
          } as unknown as UserDocument,
          {
            userId: mockFriendId
          }
        )
      ).resolves.toMatchObject({
        _id: mockUserData._id,
        firstName: mockUserData.firstName,
        lastName: mockUserData.lastName,
        avatar: mockUserData.avatar
      })
    })
  })

  // test rejectFriendRequest
  describe('rejectFriendRequest', () => {
    const mockFriendId = '656e26e021c1d294c66ea1d0'
    it('should reject friend request error', async () => {
      const addFriendto = {
        userId: mockUserData._id.toString(),
        message: 'test'
      }

      await expect(service.rejectFriendRequest(mockUserData, addFriendto)).rejects.toThrow(
        'Invalid input'
      )
    })

    it('should reject friend request error', async () => {
      const addFriendto = {
        userId: mockFriendId,
        message: 'test'
      }

      await expect(service.rejectFriendRequest(mockUserData, addFriendto)).rejects.toThrow(
        'Friend request not found'
      )
    })

    it('should reject friend request success', async () => {
      const addFriendto = {
        userId: mockFriendId,
        message: 'test'
      }

      await expect(
        service.rejectFriendRequest(
          {
            ...mockUserData,
            updateOne: jest.fn().mockResolvedValue(true),
            friendRequests: [
              {
                sender: new Types.ObjectId(mockFriendId)
              }
            ]
          } as unknown as UserDocument,
          addFriendto
        )
      ).resolves.toEqual(true)
    })
  })

  // test cancelFriendRequest
  describe('cancelFriendRequest', () => {
    const mockFriendId = '656e26e021c1d294c66ea1d0'
    it('should cancel friend request error', async () => {
      const addFriendto = {
        userId: mockUserData._id.toString(),
        message: 'test'
      }

      await expect(service.cancelFriendRequest(mockUserData, addFriendto)).rejects.toThrow(
        'Invalid input'
      )
    })

    it('should cancel friend request error', async () => {
      const addFriendto = {
        userId: mockFriendId,
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null)

      await expect(service.cancelFriendRequest(mockUserData, addFriendto)).rejects.toThrow(
        'user not found'
      )
    })

    it('should cancel friend request error', async () => {
      const addFriendto = {
        userId: mockFriendId,
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData
      })

      await expect(service.cancelFriendRequest(mockUserData, addFriendto)).rejects.toThrow(
        'Friend request not found'
      )
    })

    it('should cancel friend request error', async () => {
      const addFriendto = {
        userId: mockFriendId,
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData,
        updateOne: jest.fn().mockResolvedValue(true),
        friendRequests: [
          {
            sender: mockUserData._id
          }
        ]
      })

      await expect(service.cancelFriendRequest(mockUserData, addFriendto)).resolves.toEqual(true)
    })
  })

  // test removeFriend
  describe('removeFriend', () => {
    const mockFriendId = '656e26e021c1d294c66ea1d0'
    it('should cancel friend request error', async () => {
      const addFriendto = {
        userId: mockUserData._id.toString(),
        message: 'test'
      }

      await expect(service.removeFriend(mockUserData, addFriendto)).rejects.toThrow('Invalid input')
    })

    it('should remove friend error', async () => {
      const addFriendto = {
        userId: mockFriendId,
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null)

      await expect(service.removeFriend(mockUserData, addFriendto)).rejects.toThrow(
        'user not found'
      )
    })

    it('should remove friend error', async () => {
      const addFriendto = {
        userId: mockFriendId,
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData
      })

      await expect(service.removeFriend(mockUserData, addFriendto)).rejects.toThrow('Not friend')
    })

    it('should remove friend error', async () => {
      const addFriendto = {
        userId: '655f73eab014739c9499ab14',
        message: 'test'
      }

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue({
        ...mockUserData,
        updateOne: jest.fn().mockResolvedValue(true)
      })

      await expect(
        service.removeFriend(
          {
            ...mockUserData,
            updateOne: jest.fn().mockResolvedValue(true)
          } as unknown as UserDocument,
          addFriendto
        )
      ).resolves.toEqual(true)
    })
  })
})
