import { Test, TestingModule } from '@nestjs/testing'
import { CloudinaryService } from './cloudinary.service'

jest.mock('./cloudinary-response')

describe('CloudinaryService', () => {
  let service: CloudinaryService

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
})
