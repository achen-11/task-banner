import axios, { AxiosInstance } from 'axios';

export interface Task {
  _id: string;
  displayId: number;
  projectId: string;
  title: string;
  content: string;
  status: 'todo' | 'in_progress' | 'completed' | 'review';
  priority: 'low' | 'medium' | 'high';
  summary?: string;
  assigneeId?: string;
  creatorId: string;
  tagIds?: string[];
  moduleIds?: string[];
  progress: number;
  createdAt: number;
  updatedAt: number;
}

export interface TaskDetail extends Task {
  tags?: Array<{ _id: string; name: string; color: string }>;
  modules?: Array<{ _id: string; name: string }>;
  assignee?: { _id: string; name: string; email: string };
  creator?: { _id: string; name: string; email: string };
}

export interface TaskListResponse {
  items: TaskDetail[];
  total: number;
  page: number;
  size: number;
}

export interface TaskActivity {
  _id: string;
  taskId: string;
  userId: string;
  type: string;
  content: string;
  createdAt: number;
}

export class KbTaskApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiToken?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` })
      },
      timeout: 30000
    });
  }

  private handleResponse(response: any): any {
    if (response.data.code !== 200) {
      throw new Error(`API Error: ${response.data.message}`);
    }
    return response.data.data;
  }

  // 获取任务列表
  async listTasks(filters: {
    projectId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    tagIds?: string[];
    page?: number;
    size?: number;
  }): Promise<TaskListResponse> {
    const response = await this.client.get('/api/task/list', { params: filters });
    return this.handleResponse(response);
  }

  // 获取任务详情
  async getTask(taskId: string): Promise<TaskDetail> {
    const response = await this.client.get('/api/task/detail', {
      params: { id: taskId }
    });
    return this.handleResponse(response);
  }

  // 通过 displayId 和 projectId 获取任务详情
  async getTaskByDisplayId(displayId: string | number, projectId: string): Promise<TaskDetail> {
    const response = await this.client.get('/api/task/list', {
      params: { projectId }
    });
    const taskList = this.handleResponse(response);
    const task = taskList.items.find((t: any) => t.displayId === parseInt(displayId.toString()));
    if (!task) {
      throw new Error(`Task with displayId ${displayId} not found in project ${projectId}`);
    }
    return task;
  }

  // 创建任务
  async createTask(data: {
    projectId: string;
    title: string;
    content?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    tagIds?: string[];
    dueDate?: number;
  }): Promise<TaskDetail> {
    const response = await this.client.post('/api/task/create', data);
    return this.handleResponse(response);
  }

  // 更新任务
  async updateTask(taskId: string, updates: {
    title?: string;
    content?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    tagIds?: string[];
    summary?: string;
    progress?: number;
  }): Promise<TaskDetail> {
    const response = await this.client.put('/api/task/update', {
      id: taskId,
      ...updates
    });
    return this.handleResponse(response);
  }

  // 删除任务
  async deleteTask(taskId: string): Promise<void> {
    const response = await this.client.delete('/api/task/delete', {
      params: { id: taskId }
    });
    this.handleResponse(response);
  }

  // 添加评论
  async addComment(taskId: string, content: string, mentionedUsers?: string[]): Promise<TaskActivity> {
    const response = await this.client.post('/api/task/comment', {
      taskId,
      content,
      mentionedUsers
    });
    return this.handleResponse(response);
  }

  // 获取任务活动历史
  async getTaskActivities(taskId: string): Promise<TaskActivity[]> {
    const response = await this.client.get('/api/task/activities', {
      params: { taskId }
    });
    return this.handleResponse(response);
  }

  // 获取项目列表
  async listProjects(): Promise<{ items: any[] }> {
    const response = await this.client.get('/api/project/list');
    return this.handleResponse(response);
  }
}
