import { Test, TestingModule } from '@nestjs/testing'
import { CloudinaryService, ImageType } from './cloudinary.service'
import { UploadApiResponse, v2 } from 'cloudinary'

jest.mock('./cloudinary-response')

describe('CloudinaryService', () => {
  let service: CloudinaryService
  const mockResult: UploadApiResponse = {
    public_id: 'public_id',
    version: 1,
    signature: 'signature',
    width: 100,
    height: 100,
    format: 'jpg',
    resource_type: 'image',
    created_at: '2021-10-01T00:00:00Z',
    tags: ['test'],
    pages: 0,
    bytes: 0,
    type: '',
    etag: '',
    placeholder: false,
    url: '',
    secure_url: 'secure_url',
    access_mode: '',
    original_filename: '',
    moderation: [],
    access_control: [],
    context: undefined,
    metadata: undefined
  }

  const mockCloudinary = {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn()
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: 'CLOUDINARY',
          useValue: mockCloudinary
        }
      ]
    }).compile()

    service = module.get<CloudinaryService>(CloudinaryService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('uploadFile', () => {
    jest.spyOn(v2.uploader, 'upload').mockResolvedValue(mockResult as UploadApiResponse)

    it('should return a Cloudinary cloud file', async () => {
      const cloudFile = await service.uploadFile(
        { path: 'path' } as Express.Multer.File,
        ImageType.AVATAR
      )
      expect(cloudFile).toEqual(mockResult)
    })

    it('should return a Cloudinary cloud file', async () => {
      const cloudFile = await service.uploadFile(
        { path: 'path' } as Express.Multer.File,
        ImageType.CHAT
      )
      expect(cloudFile).toEqual(mockResult)
    })

    it('should throw an error', async () => {
      jest.spyOn(v2.uploader, 'upload').mockResolvedValue(null)
      const cloudFile = await service.uploadFile(
        { path: 'path' } as Express.Multer.File,
        ImageType.CHAT
      )
      expect(cloudFile).toEqual(null)
    })

    it('should throw an error', async () => {
      jest.spyOn(v2.uploader, 'upload').mockRejectedValue(new Error('error'))

      await expect(
        service.uploadFile({ path: 'path' } as Express.Multer.File, ImageType.CHAT)
      ).rejects.toThrowError('Could not upload file')
    })
  })

  describe('Remove File in cloudinary', () => {
    jest.spyOn(v2.uploader, 'destroy').mockResolvedValue({ result: 'ok' })

    it('should return a Cloudinary cloud file', async () => {
      const response = await service.destroyFile(
        'agora/images/avatars/public_id.jpg',
        ImageType.AVATAR
      )
      expect(response).toMatchObject({ result: 'ok' })
    })

    it('should return a Cloudinary cloud file', async () => {
      const response = await service.destroyFile('agora/images/chats/public_id.jpg', ImageType.CHAT)
      expect(response).toMatchObject({ result: 'ok' })
    })

    it('should throw an error', async () => {
      jest.spyOn(v2.uploader, 'destroy').mockRejectedValue(new Error('error'))

      await expect(
        service.destroyFile('agora/images/chats/public_id.jpg', ImageType.CHAT)
      ).rejects.toThrowError('Could not remove file')
    })
  })

  describe('clearFile', () => {
    it('should return true', () => {
      const result = service.clearFile('filePath')
      expect(result).toBe(true)
    })
  })
})
