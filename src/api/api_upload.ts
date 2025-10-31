//@k-url /api/upload/{action}
import { getFilePath, failResponse, successResponse } from "code/utils";
import TaskFilesModel, { RelationType } from "code/Models/task_attachment";
import { getUserInfo } from "code/Services/user";
k.api.post('/task', body => {
  const task_id = k.request.form.get("task_id");
  const files = k.request.files;
  if (!task_id) {
    return failResponse("任务ID不能为空");
  }
  if (files.length < 0) {
    return failResponse("文件丢失, 请重试");
  }
  const result = [];
  const userInfo = getUserInfo();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let {
      fileName
    } = file;
    // 重名加后缀 (1) (2) (3) ...
    const newFilePath = getFilePath('task_' + task_id, fileName);
    const fileInfo = k.file.writeBinary(newFilePath, file.bytes);
    const taskFile = {
      file_name: fileInfo.name,
      file_path: fileInfo.url,
      file_size: fileInfo.size,
      file_type: file.contentType,
      relation_id: task_id,
      relation_type: RelationType.Task,
      user_id: userInfo._id
    };
    const taskFileId = TaskFilesModel.create(taskFile);
    result.push({
      ...taskFile,
      _id: taskFileId
    });
  }
  return successResponse(result);
});
k.api.post('comment', body => {
  const comment_id = k.request.form.get("comment_id");
  const files = k.request.files;
  if (!comment_id) {
    return failResponse("评论ID不能为空");
  }
  if (files.length < 0) {
    return failResponse("文件丢失, 请重试");
  }
  const result = [];
  const userInfo = getUserInfo();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let {
      fileName
    } = file;
    // 重名加后缀 (1) (2) (3) ...
    const newFilePath = getFilePath('comment_' + comment_id, fileName);
    const fileInfo = k.file.writeBinary(newFilePath, file.bytes);
    const taskFile = {
      file_name: fileInfo.name,
      file_path: fileInfo.url,
      file_size: fileInfo.size,
      file_type: file.contentType,
      relation_id: comment_id,
      relation_type: RelationType.Comment,
      user_id: userInfo._id
    };
    const taskFileId = TaskFilesModel.create(taskFile);
    result.push({
      ...taskFile,
      _id: taskFileId
    });
  }
  return successResponse(result);
});
k.api.post(() => {
  const files = k.request.files;
  if (files.length < 0) {
    return failResponse("文件丢失, 请重试");
  }
  const file = files[0];
  let {
    fileName
  } = file;
  // 重名加后缀 (1) (2) (3) ...
  const newFilePath = getFilePath(k.user.current?.userName, fileName);
  const fileInfo = k.file.writeBinary(newFilePath, file.bytes);
  return successResponse({
    fileName: fileInfo.fullName,
    url: fileInfo.relativeUrl
  });
});