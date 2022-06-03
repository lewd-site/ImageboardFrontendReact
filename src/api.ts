import config from './config';
import { Board, Markup, File, Thread, Post } from './domain';

export class ApiError extends Error {}

interface BoardDto {
  readonly slug: string;
  readonly title: string;
  readonly created_at: string;
  readonly post_count: number;
}

interface FileDto {
  readonly hash: string;
  readonly extension: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly path: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly length: number | null;
  readonly created_at: string;
}

interface ThreadDto {
  readonly slug: string;
  readonly id: number;
  readonly subject: string;
  readonly name: string | null;
  readonly tripcode: string | null;
  readonly files: FileDto[];
  readonly message: string;
  readonly message_parsed: Markup[];
  readonly created_at: string;
  readonly bumped_at: string;
  readonly post_count: number;
}

interface PostDto {
  readonly slug: string;
  readonly id: number;
  readonly parent_id: number;
  readonly subject: string;
  readonly name: string | null;
  readonly tripcode: string | null;
  readonly files: FileDto[];
  readonly message: string;
  readonly message_parsed: Markup[];
  readonly created_at: string;
}

const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 200;

function isBoardDto(board: any): board is BoardDto {
  return (
    typeof board.slug === 'string' &&
    typeof board.title === 'string' &&
    typeof board.created_at === 'string' &&
    typeof board.post_count === 'number'
  );
}

function isFileDto(file: any): file is FileDto {
  return (
    typeof file.hash === 'string' &&
    typeof file.extension === 'string' &&
    typeof file.name === 'string' &&
    typeof file.path === 'string' &&
    typeof file.type === 'string' &&
    typeof file.size === 'number' &&
    (('width' in file && file.width === null) || typeof file.width === 'number') &&
    (('height' in file && file.height === null) || typeof file.height === 'number') &&
    (('length' in file && file.length === null) || typeof file.length === 'number') &&
    typeof file.created_at === 'string'
  );
}

function isThreadDto(thread: any): thread is ThreadDto {
  return (
    typeof thread.slug === 'string' &&
    typeof thread.id === 'number' &&
    typeof thread.subject === 'string' &&
    (('name' in thread && thread.name === null) || typeof thread.name === 'string') &&
    (('tripcode' in thread && thread.tripcode === null) || typeof thread.tripcode === 'string') &&
    'files' in thread &&
    Array.isArray(thread.files) &&
    thread.files.every(isFileDto) &&
    typeof thread.message === 'string' &&
    'message_parsed' in thread &&
    Array.isArray(thread.message_parsed) &&
    typeof thread.created_at === 'string' &&
    typeof thread.bumped_at === 'string' &&
    typeof thread.post_count === 'number'
  );
}

function isPostDto(post: any): post is PostDto {
  return (
    typeof post.slug === 'string' &&
    typeof post.id === 'number' &&
    typeof post.parent_id === 'number' &&
    (('name' in post && post.name === null) || typeof post.name === 'string') &&
    (('tripcode' in post && post.tripcode === null) || typeof post.tripcode === 'string') &&
    'files' in post &&
    Array.isArray(post.files) &&
    post.files.every(isFileDto) &&
    typeof post.message === 'string' &&
    'message_parsed' in post &&
    Array.isArray(post.message_parsed) &&
    typeof post.created_at === 'string'
  );
}

function convertBoardDtoToBoard(board: BoardDto): Board {
  return {
    slug: board.slug,
    title: board.title,
    createdAt: new Date(board.created_at),
    postCount: board.post_count,
  };
}

function convertFileDtoToFile(file: FileDto): File {
  return {
    hash: file.hash,
    extension: file.extension,
    name: file.name,
    size: file.size,
    type: file.type,
    path: file.path,
    width: file.width,
    height: file.height,
    length: file.length,
    createdAt: new Date(file.created_at),

    get isTransparent() {
      return ['png', 'gif', 'webp'].includes(this.extension);
    },
    get originalUrl() {
      return `${config.content.baseUrl}/original/${this.hash}.${this.extension}`;
    },

    get thumbnailWidth() {
      const width = this.width || THUMB_WIDTH;
      const height = this.height || THUMB_HEIGHT;

      return width / Math.max(1, width / THUMB_WIDTH, height / THUMB_HEIGHT);
    },
    get thumbnailHeight() {
      const width = this.width || THUMB_WIDTH;
      const height = this.height || THUMB_HEIGHT;

      return height / Math.max(1, width / THUMB_WIDTH, height / THUMB_HEIGHT);
    },
    get thumbnailUrl() {
      return `${config.content.baseUrl}/thumbnails/${this.hash}.webp`;
    },

    get fallbackThumbnailExtension() {
      return this.isTransparent ? 'png' : 'jpg';
    },
    get fallbackThumbnailType() {
      return this.isTransparent ? 'image/png' : 'image/jpeg';
    },
    get fallbackThumbnailUrl() {
      return `${config.content.baseUrl}/thumbnails/${this.hash}.${this.fallbackThumbnailExtension}`;
    },
  };
}

function convertThreadDtoToThread(thread: ThreadDto): Thread {
  return {
    slug: thread.slug,
    id: thread.id,
    subject: thread.subject,
    name: thread.name !== null ? thread.name : '',
    tripcode: thread.tripcode !== null ? thread.tripcode : '',
    files: thread.files.map(convertFileDtoToFile),
    message: thread.message,
    messageParsed: thread.message_parsed,
    createdAt: new Date(thread.created_at),
    bumpedAt: new Date(thread.bumped_at),
    postCount: thread.post_count,
  };
}

function convertPostDtoToPost(post: PostDto): Post {
  return {
    slug: post.slug,
    id: post.id,
    parentId: post.parent_id,
    name: post.name !== null ? post.name : '',
    tripcode: post.tripcode !== null ? post.tripcode : '',
    files: post.files.map(convertFileDtoToFile),
    message: post.message,
    messageParsed: post.message_parsed,
    createdAt: new Date(post.created_at),
  };
}

export async function browseBoards(): Promise<Board[]> {
  const response = await fetch(`${config.api.baseUrl}/boards`);
  const { items } = await response.json();
  if (!Array.isArray(items)) {
    throw new ApiError('items: array expected');
  }

  return items.map((item) => {
    if (!isBoardDto(item)) {
      throw new ApiError(`Invalid board DTO: ${JSON.stringify(item)}`);
    }

    return convertBoardDtoToBoard(item);
  });
}

export async function browseThreads(slug: string): Promise<Thread[]> {
  const response = await fetch(`${config.api.baseUrl}/boards/${slug}/threads`);
  const { items } = await response.json();
  if (!Array.isArray(items)) {
    throw new ApiError('items: array expected');
  }

  return items.map((item) => {
    if (!isThreadDto(item)) {
      throw new ApiError(`Invalid thread DTO: ${JSON.stringify(item)}`);
    }

    return convertThreadDtoToThread(item);
  });
}

export async function browsePosts(slug: string, parentId: number): Promise<Post[]> {
  const response = await fetch(`${config.api.baseUrl}/boards/${slug}/threads/${parentId}/posts`);
  const { items } = await response.json();
  if (!Array.isArray(items)) {
    throw new ApiError('items: array expected');
  }

  return items.map((item) => {
    if (!isPostDto(item)) {
      throw new ApiError(`Invalid post DTO: ${JSON.stringify(item)}`);
    }

    return convertPostDtoToPost(item);
  });
}
