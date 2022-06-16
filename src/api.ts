import config from './config';
import { Board, Markup, Thread, Post, File as FileModel } from './domain';

export class ApiError extends Error {}

export interface BoardDto {
  readonly slug: string;
  readonly title: string;
  readonly created_at: string;
  readonly post_count: number;
}

export interface FileDto {
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

export interface ThreadDto {
  readonly slug: string;
  readonly id: number;
  readonly subject: string | null;
  readonly name: string | null;
  readonly tripcode: string | null;
  readonly files: FileDto[];
  readonly message: string;
  readonly message_parsed: Markup[];
  readonly created_at: string;
  readonly bumped_at: string;
  readonly post_count: number;
  readonly replies: PostDto[];
}

export interface PostDto {
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

interface RequestOptions {
  setCancel?: (cancel: () => void) => void;
  onUploadProgress?: (sent: number, total: number, speed: number) => void;
  onUploaded?: () => void;
  onDownloadProgress?: (received: number, total: number, speed: number) => void;
}

const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 200;

export function isBoardDto(board: any): board is BoardDto {
  return (
    typeof board.slug === 'string' &&
    typeof board.title === 'string' &&
    typeof board.created_at === 'string' &&
    typeof board.post_count === 'number'
  );
}

export function isFileDto(file: any): file is FileDto {
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

export function isThreadDto(thread: any): thread is ThreadDto {
  return (
    typeof thread.slug === 'string' &&
    typeof thread.id === 'number' &&
    (('subject' in thread && thread.subject === null) || typeof thread.subject === 'string') &&
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

export function isPostDto(post: any): post is PostDto {
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

export function convertBoardDtoToBoard(board: BoardDto): Board {
  return {
    slug: board.slug,
    title: board.title,
    createdAt: new Date(board.created_at),
    postCount: board.post_count,
  };
}

export function convertFileDtoToFile(file: FileDto): FileModel {
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

    get isAudioWithoutPreview() {
      return this.type.startsWith('audio/') && (this.width === null || this.height === null);
    },

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
      if (this.isAudioWithoutPreview) {
        return '/audio.webp';
      }

      return `${config.content.baseUrl}/thumbnails/${this.hash}.webp`;
    },

    get fallbackThumbnailExtension() {
      if (this.isAudioWithoutPreview) {
        return 'png';
      }

      return this.isTransparent ? 'png' : 'jpg';
    },
    get fallbackThumbnailType() {
      if (this.isAudioWithoutPreview) {
        return 'image/png';
      }

      return this.isTransparent ? 'image/png' : 'image/jpeg';
    },
    get fallbackThumbnailUrl() {
      if (this.isAudioWithoutPreview) {
        return '/audio.png';
      }

      return `${config.content.baseUrl}/thumbnails/${this.hash}.${this.fallbackThumbnailExtension}`;
    },
  };
}

export function convertThreadDtoToThread(thread: ThreadDto): Thread {
  return {
    slug: thread.slug,
    id: thread.id,
    subject: thread.subject !== null ? thread.subject : '',
    name: thread.name !== null ? thread.name : '',
    tripcode: thread.tripcode !== null ? thread.tripcode : '',
    files: thread.files.map(convertFileDtoToFile),
    message: thread.message,
    messageParsed: thread.message_parsed,
    createdAt: new Date(thread.created_at),
    bumpedAt: new Date(thread.bumped_at),
    postCount: thread.post_count,
    replies: thread.replies.map(convertPostDtoToPost),
  };
}

export function convertPostDtoToPost(post: PostDto): Post {
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

export async function browseThreads(slug: string, page: number = 0): Promise<Thread[]> {
  const response = await fetch(`${config.api.baseUrl}/boards/${slug}/threads?page=${page}`);
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

export async function browseAllThreads(slug: string): Promise<Thread[]> {
  const result = [];

  for (let page = 0; ; page++) {
    const threads = await browseThreads(slug, page);
    if (threads.length === 0) {
      break;
    }

    result.push(...threads);
  }

  return result;
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

async function sendRequest(
  url: string | URL,
  body: FormData,
  { setCancel, onUploadProgress, onUploaded, onDownloadProgress }: RequestOptions = {}
): Promise<XMLHttpRequest> {
  let now = Date.now();

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.responseType = 'json';

  return new Promise((resolve, reject) => {
    if (typeof setCancel !== 'undefined') {
      setCancel(() => {
        xhr.abort();
        reject(new ApiError('Отправка отменена'));
      });
    }

    if (typeof onUploadProgress !== 'undefined') {
      xhr.upload.addEventListener('progress', (event) => {
        const elapsedSeconds = Math.max(1, Date.now() - now) / 1000;
        const speed = event.loaded / elapsedSeconds;
        onUploadProgress(event.loaded, event.total, speed);
      });
    }

    if (typeof onUploaded !== 'undefined') {
      xhr.upload.addEventListener('load', () => {
        now = Date.now();
        onUploaded();
      });
    }

    if (typeof onDownloadProgress !== 'undefined') {
      xhr.addEventListener('progress', (event) => {
        const elapsedSeconds = Math.max(1, Date.now() - now) / 1000;
        const speed = event.loaded / elapsedSeconds;
        onDownloadProgress(event.loaded, event.total, speed);
      });
    }

    xhr.addEventListener('load', () => {
      resolve(xhr);
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError(`${xhr.status} ${xhr.statusText}`));
    });

    xhr.send(body);
  });
}

export async function createThread(
  slug: string,
  subject: string,
  name: string,
  message: string,
  files: File[],
  options: RequestOptions = {}
): Promise<Thread> {
  const url = new URL(`${config.api.baseUrl}/boards/${slug}/threads`);
  const body = new FormData();
  body.append('subject', subject);
  body.append('name', name);
  body.append('message', message);
  for (const file of files) {
    body.append('files', file, file.name);
  }

  const xhr = await sendRequest(url, body, options);
  if (xhr.status === 400 && typeof xhr.response === 'object' && 'field' in xhr.response && 'message' in xhr.response) {
    const fields: { [key: string]: string } = { subject: 'тема', name: 'имя', message: 'сообщение' } as const;
    const fieldName = xhr.response.field;
    const field = typeof fields[fieldName] !== 'undefined' ? fields[fieldName] : xhr.response.field;
    switch (xhr.response.message) {
      case 'mimetype':
        throw new ApiError('Неподдерживаемый тип файла');

      case 'required':
        throw new ApiError(`Поле ${field} обязательно для заполнения`);
    }
  }

  if (xhr.status !== 201) {
    throw new ApiError(`${xhr.status} ${xhr.statusText}`);
  }

  if (!('item' in xhr.response)) {
    throw new ApiError(`Invalid response: ${JSON.stringify(xhr.response)}`);
  }

  const { item } = xhr.response;
  if (!isThreadDto(item)) {
    throw new ApiError(`Invalid thread DTO: ${JSON.stringify(item)}`);
  }

  return convertThreadDtoToThread(item);
}

export async function createPost(
  slug: string,
  parentId: number,
  name: string,
  message: string,
  files: File[],
  options: RequestOptions = {}
): Promise<Post> {
  const url = new URL(`${config.api.baseUrl}/boards/${slug}/threads/${parentId}/posts`);
  const body = new FormData();
  body.append('name', name);
  body.append('message', message);
  for (const file of files) {
    body.append('files', file, file.name);
  }

  const xhr = await sendRequest(url, body, options);
  if (xhr.status === 400 && typeof xhr.response === 'object' && 'field' in xhr.response && 'message' in xhr.response) {
    const fields: { [key: string]: string } = { name: 'имя', message: 'сообщение' } as const;
    const fieldName = xhr.response.field;
    const field = typeof fields[fieldName] !== 'undefined' ? fields[fieldName] : xhr.response.field;
    switch (xhr.response.message) {
      case 'mimetype':
        throw new ApiError('Неподдерживаемый тип файла');

      case 'required':
        throw new ApiError(`Поле ${field} обязательно для заполнения`);
    }
  }

  if (xhr.status !== 201) {
    throw new ApiError(`${xhr.status} ${xhr.statusText}`);
  }

  if (!('item' in xhr.response)) {
    throw new ApiError(`Invalid response: ${JSON.stringify(xhr.response)}`);
  }

  const { item } = xhr.response;
  if (!isPostDto(item)) {
    throw new ApiError(`Invalid post DTO: ${JSON.stringify(item)}`);
  }

  return convertPostDtoToPost(item);
}
