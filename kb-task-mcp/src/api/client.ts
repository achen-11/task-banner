import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * kb-task API 客户端
 */
export class KbTaskApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private apiToken: string;

  constructor(baseURL: string, apiToken?: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // 移除末尾斜杠
    this.apiToken = apiToken || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` })
      },
      timeout: 30000
    });

    // 响应拦截器：统一处理错误
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // API 返回了错误响应
          const data = error.response.data as any;
          throw new Error(data.message || `API Error: ${error.response.status}`);
        } else if (error.request) {
          // 请求已发出但没有收到响应
          throw new Error('Network error: No response from server');
        } else {
          // 其他错误
          throw new Error(error.message || 'Unknown error');
        }
      }
    );
  }

  /**
   * 获取任务列表
   */
  async listTasks(params: {
    projectId: string;
    moduleId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    page?: number;
    size?: number;
    sortField?: string;
    sortDirection?: string;
  }) {
    const response = await this.client.get('/api/task/list', { params });
    return response.data;
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string) {
    const response = await this.client.get('/api/task/detail', {
      params: { id: taskId }
    });
    return response.data;
  }

  /**
   * 创建任务
   */
  async createTask(data: {
    projectId: string;
    moduleIds?: string[];
    title: string;
    content?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    tagIds?: string[];
    dueDate?: number;
    progress?: number;
    summary?: string;
  }) {
    const response = await this.client.post('/api/task/create', data);
    return response.data;
  }

  /**
   * 更新任务
   */
  async updateTask(taskId: string, updates: {
    title?: string;
    content?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    moduleIds?: string[];
    tagIds?: string[];
    dueDate?: number;
    progress?: number;
    summary?: string;
  }) {
    const response = await this.client.put('/api/task/update', {
      id: taskId,
      ...updates
    });
    return response.data;
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string) {
    const response = await this.client.delete('/api/task/delete', {
      data: { id: taskId }
    });
    return response.data;
  }

  /**
   * 添加任务评论
   */
  async addComment(
    taskId: string,
    content: string,
    options?: {
      summary?: string;
      type?: string;
      mentionedUsers?: string[];
      attachments?: any[];
      metadata?: any;
    }
  ) {
    const response = await this.client.post('/api/task/comment', {
      taskId,
      content,
      ...options
    });
    return response.data;
  }

  /**
   * 获取任务评论列表
   */
  async getComments(taskId: string, params?: {
    page?: number;
    size?: number;
    type?: string;
  }) {
    const response = await this.client.get('/api/task/comments', {
      params: {
        taskId,
        ...params
      }
    });
    return response.data;
  }

  /**
   * 获取任务活动历史
   */
  async getTaskActivities(taskId: string) {
    const response = await this.client.get('/api/task/activities', {
      params: { taskId }
    });
    return response.data;
  }

  /**
   * 获取项目列表
   */
  async listProjects(params?: {
    page?: number;
    size?: number;
  }) {
    const response = await this.client.get('/api/project/list', { params });
    return response.data;
  }

  /**
   * 获取项目详情
   */
  async getProject(projectId: string) {
    const response = await this.client.get('/api/project/detail', {
      params: { id: projectId }
    });
    return response.data;
  }

  /**
   * 获取项目标签列表
   */
  async listTags(projectId: string) {
    const response = await this.client.get('/api/tag/list', {
      params: { projectId }
    });
    return response.data;
  }
}
