const API_BASE_URL = "http://127.0.0.1:8000/api";

/*
  ==========================================================
  GET JWT ACCESS TOKEN
  ==========================================================
*/

const getAccessToken = () => {
  return (
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token")
  );
};

/*
  ==========================================================
  FORMAT BACKEND ERRORS
  ==========================================================
*/

const getErrorMessage = (data) => {
  if (!data) {
    return "Something went wrong while processing the request.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.message) {
    return data.message;
  }

  if (data.detail) {
    return data.detail;
  }

  if (typeof data === "object") {
    const fieldErrors = Object.entries(data)
      .map(([field, messages]) => {
        const readableField = field
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
          );

        if (Array.isArray(messages)) {
          return `${readableField}: ${messages.join(" ")}`;
        }

        if (
          messages &&
          typeof messages === "object"
        ) {
          return `${readableField}: ${JSON.stringify(messages)}`;
        }

        return `${readableField}: ${String(messages)}`;
      })
      .join(" ");

    if (fieldErrors) {
      return fieldErrors;
    }
  }

  return "Something went wrong while processing the request.";
};

/*
  ==========================================================
  COMMON AUTHENTICATED REQUEST HELPER
  ==========================================================
*/

const apiRequest = async (
  url,
  options = {},
) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error(
      "Authentication token not found. Please log in again.",
    );
  }

  const response = await fetch(url, {
    ...options,

    headers: {
      Accept: "application/json",

      Authorization: `Bearer ${accessToken}`,

      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),

      ...options.headers,
    },
  });

  let data = {};

  /*
    Some DELETE APIs return:

    204 No Content

    response.json() would fail because
    there is no response body.

    This try/catch safely supports both:
    - JSON responses
    - 204 No Content responses
  */

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data),
    );
  }

  return data;
};

// ==========================================================
// 1. GET ALL PROJECTS
// GET /api/projects/
// ==========================================================

export const getProjects = async () => {
  return apiRequest(
    `${API_BASE_URL}/projects/`,
    {
      method: "GET",
    },
  );
};

// ==========================================================
// 2. CREATE PROJECT
// POST /api/projects/
// ==========================================================

export const createProject = async (
  projectData,
) => {
  const name =
    projectData?.name?.trim();

  const projectKey =
    projectData?.project_key
      ?.trim()
      .toUpperCase();

  if (!name) {
    throw new Error(
      "Project name is required.",
    );
  }

  if (!projectKey) {
    throw new Error(
      "Project key is required.",
    );
  }

  return apiRequest(
    `${API_BASE_URL}/projects/`,
    {
      method: "POST",

      body: JSON.stringify({
        name,

        project_key: projectKey,

        description:
          projectData?.description?.trim() ||
          "",

        start_date:
          projectData?.start_date ||
          null,

        end_date:
          projectData?.end_date ||
          null,

        status:
          projectData?.status ||
          "ACTIVE",
      }),
    },
  );
};

// ==========================================================
// 3. GET SINGLE PROJECT
// GET /api/projects/{projectId}/
// ==========================================================

export const getProjectDetails = async (
  projectId,
) => {
  if (!projectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  return apiRequest(
    `${API_BASE_URL}/projects/${projectId}/`,
    {
      method: "GET",
    },
  );
};

// ==========================================================
// 4. GET PROJECT MEMBERS
// GET /api/projects/{projectId}/members/
// ==========================================================

export const getProjectMembers = async (
  projectId,
) => {
  if (!projectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  return apiRequest(
    `${API_BASE_URL}/projects/${projectId}/members/`,
    {
      method: "GET",
    },
  );
};

// ==========================================================
// 5. GET PROJECT TASKS
// GET /api/projects/{projectId}/tasks/
// ==========================================================

export const getProjectTasks = async (
  projectId,
) => {
  if (!projectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  return apiRequest(
    `${API_BASE_URL}/projects/${projectId}/tasks/`,
    {
      method: "GET",
    },
  );
};

// ==========================================================
// 6. CREATE PROJECT TASK
// POST /api/projects/{projectId}/tasks/
// ==========================================================
//
// Required:
// - title
// - assigned_to
//
// Optional:
// - description
// - priority: LOW | MEDIUM | HIGH
// - due_date: YYYY-MM-DD
//
// New tasks automatically start with:
// status = TODO
// ==========================================================

export const createProjectTask = async (
  projectId,
  taskData,
) => {
  if (!projectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  const title =
    taskData?.title?.trim();

  if (!title) {
    throw new Error(
      "Task title is required.",
    );
  }

  const assignedTo =
    Number(
      taskData?.assigned_to,
    );

  if (
    !Number.isInteger(assignedTo) ||
    assignedTo <= 0
  ) {
    throw new Error(
      "Please select a valid project member.",
    );
  }

  const allowedPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
  ];

  const priority =
    taskData?.priority ||
    "MEDIUM";

  if (
    !allowedPriorities.includes(
      priority,
    )
  ) {
    throw new Error(
      "Invalid task priority.",
    );
  }

  const payload = {
    title,

    assigned_to: assignedTo,

    priority,
  };

  const description =
    taskData?.description?.trim();

  if (description) {
    payload.description =
      description;
  }

  if (taskData?.due_date) {
    payload.due_date =
      taskData.due_date;
  }

  return apiRequest(
    `${API_BASE_URL}/projects/${projectId}/tasks/`,
    {
      method: "POST",

      body: JSON.stringify(
        payload,
      ),
    },
  );
};

// ==========================================================
// 7. INVITE MULTIPLE PROJECT MEMBERS
// POST /api/projects/{projectId}/invitations/
// ==========================================================
//
// Request:
//
// {
//   "emails": [
//     "sara@example.com",
//     "ahmed@example.com"
//   ]
// }
//
// ==========================================================

export const inviteProjectMembers = async (
  projectId,
  emails,
) => {
  if (!projectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  if (!Array.isArray(emails)) {
    throw new Error(
      "Email addresses must be provided as a list.",
    );
  }

  const normalizedEmails = [
    ...new Set(
      emails
        .map((email) =>
          String(email)
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  ];

  if (
    normalizedEmails.length === 0
  ) {
    throw new Error(
      "At least one email address is required.",
    );
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const invalidEmail =
    normalizedEmails.find(
      (email) =>
        !emailPattern.test(email),
    );

  if (invalidEmail) {
    throw new Error(
      `${invalidEmail} is not a valid email address.`,
    );
  }

  return apiRequest(
    `${API_BASE_URL}/projects/${projectId}/invitations/`,
    {
      method: "POST",

      body: JSON.stringify({
        emails: normalizedEmails,
      }),
    },
  );
};

// ==========================================================
// 8. GET SINGLE TASK DETAILS
// GET /api/tasks/{taskId}/
// ==========================================================
//
// Request body:
// none
//
// Success:
//
// {
//   "message": "Task retrieved successfully.",
//   "data": {
//     "id": 15,
//     "title": "Design Login Page",
//     "description": "...",
//     "project": {
//       "id": 3,
//       "name": "webdesign",
//       "project_key": "WEB1225"
//     },
//     "assigned_to": {...},
//     "created_by": {...},
//     "priority": "HIGH",
//     "status": "IN_PROGRESS",
//     "due_date": "2026-07-30",
//     "created_at": "...",
//     "updated_at": "...",
//     "completed_at": null
//   }
// }
//
// Permission:
//
// Project Admin     -> allowed
// Active assignee   -> allowed
// Others            -> 404
// ==========================================================

export const getTaskDetails = async (
  taskId,
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required.",
    );
  }

  return apiRequest(
    `${API_BASE_URL}/tasks/${taskId}/`,
    {
      method: "GET",
    },
  );
};

// ==========================================================
// 9. UPDATE TASK DETAILS
// PATCH /api/tasks/{taskId}/
// ==========================================================
//
// Allowed:
// - title
// - description
// - assigned_to
// - priority
// - due_date
//
// This endpoint does not update task status.
//
// Permission:
// Project Admin only.
// ==========================================================

export const updateTask = async (
  taskId,
  taskData,
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required.",
    );
  }

  if (
    !taskData ||
    typeof taskData !== "object"
  ) {
    throw new Error(
      "Task data is required.",
    );
  }

  const payload = {};

  if (
    taskData.title !== undefined
  ) {
    const title =
      String(
        taskData.title,
      ).trim();

    if (!title) {
      throw new Error(
        "Task title cannot be empty.",
      );
    }

    payload.title = title;
  }

  if (
    taskData.description !==
    undefined
  ) {
    payload.description =
      String(
        taskData.description ||
          "",
      ).trim();
  }

  if (
    taskData.assigned_to !==
    undefined
  ) {
    const assignedTo =
      Number(
        taskData.assigned_to,
      );

    if (
      !Number.isInteger(
        assignedTo,
      ) ||
      assignedTo <= 0
    ) {
      throw new Error(
        "Please select a valid project member.",
      );
    }

    payload.assigned_to =
      assignedTo;
  }

  if (
    taskData.priority !==
    undefined
  ) {
    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
    ];

    const priority =
      String(
        taskData.priority,
      ).toUpperCase();

    if (
      !allowedPriorities.includes(
        priority,
      )
    ) {
      throw new Error(
        "Invalid task priority.",
      );
    }

    payload.priority =
      priority;
  }

  if (
    taskData.due_date !==
    undefined
  ) {
    payload.due_date =
      taskData.due_date ||
      null;
  }

  if (
    Object.keys(payload).length ===
    0
  ) {
    throw new Error(
      "No task fields were provided for update.",
    );
  }

  return apiRequest(
    `${API_BASE_URL}/tasks/${taskId}/`,
    {
      method: "PATCH",

      body: JSON.stringify(
        payload,
      ),
    },
  );
};

// ==========================================================
// 10. UPDATE TASK STATUS
// PATCH /api/tasks/{taskId}/status/
// ==========================================================
//
// Allowed:
//
// TODO
// IN_PROGRESS
// DONE
//
// Backend workflow example:
//
// TODO -> IN_PROGRESS -> DONE
//
// Example invalid transition:
//
// TODO -> DONE
//
// Permission:
//
// Project Admin   -> allowed
// Active assignee -> allowed
// Others          -> 403
// ==========================================================

export const updateTaskStatus = async (
  taskId,
  status,
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required.",
    );
  }

  const allowedStatuses = [
    "TODO",
    "IN_PROGRESS",
    "DONE",
  ];

  const normalizedStatus =
    String(
      status || "",
    ).toUpperCase();

  if (
    !allowedStatuses.includes(
      normalizedStatus,
    )
  ) {
    throw new Error(
      "Invalid task status.",
    );
  }

  return apiRequest(
    `${API_BASE_URL}/tasks/${taskId}/status/`,
    {
      method: "PATCH",

      body: JSON.stringify({
        status:
          normalizedStatus,
      }),
    },
  );
};

// ==========================================================
// 11. DELETE TASK
// DELETE /api/tasks/{taskId}/
// ==========================================================
//
// Request body:
// none
//
// Success:
// HTTP 204 No Content
//
// There is NO JSON response body.
//
// Permission:
//
// Project Admin -> allowed
// Member        -> not allowed
// ==========================================================

export const deleteTask = async (
  taskId,
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required.",
    );
  }

  /*
    Backend returns:

    204 No Content

    apiRequest() already safely handles
    empty response bodies.
  */

  return apiRequest(
    `${API_BASE_URL}/tasks/${taskId}/`,
    {
      method: "DELETE",
    },
  );
};

// ==========================================================
// 12. UPDATE PROJECT
// PATCH /api/projects/{projectId}/
// ==========================================================
//
// Backend allows partial updates.
//
// Supported fields:
//
// - name
// - project_key
// - description
// - start_date
// - end_date
// - status
//
// Success:
//
// {
//   "message": "Project updated successfully.",
//   "data": {
//     ...updatedProject
//   }
// }
//
// Permissions:
//
// Only active Project ADMIN can update.
//
// Backend validations:
//
// - Archived projects cannot be modified
// - name minimum 3 characters
// - project_key uppercase
// - project_key valid format
// - project_key unique
// - end_date cannot be before start_date
// ==========================================================

export const updateProject = async (
  projectId,
  projectData,
) => {
  if (!projectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  if (
    !projectData ||
    typeof projectData !== "object"
  ) {
    throw new Error(
      "Project data is required.",
    );
  }

  const payload = {};

  // ------------------------------------------
  // NAME
  // ------------------------------------------

  if (
    projectData.name !== undefined
  ) {
    const name =
      String(
        projectData.name,
      ).trim();

    if (!name) {
      throw new Error(
        "Project name cannot be empty.",
      );
    }

    if (name.length < 3) {
      throw new Error(
        "Project name must be at least 3 characters.",
      );
    }

    payload.name = name;
  }

  // ------------------------------------------
  // PROJECT KEY
  // ------------------------------------------

  if (
    projectData.project_key !==
    undefined
  ) {
    const projectKey =
      String(
        projectData.project_key,
      )
        .trim()
        .toUpperCase();

    if (!projectKey) {
      throw new Error(
        "Project key cannot be empty.",
      );
    }

    /*
      Backend rule:

      - Must start with a letter
      - After that:
        A-Z
        0-9
        _
        -

      Examples:

      WEB2      valid
      JIRA_22   valid
      APP-12    valid
      22WEB     invalid
    */

    const projectKeyPattern =
      /^[A-Z][A-Z0-9_-]*$/;

    if (
      !projectKeyPattern.test(
        projectKey,
      )
    ) {
      throw new Error(
        "Project key must start with a letter and contain only uppercase letters, numbers, underscores, or hyphens.",
      );
    }

    payload.project_key =
      projectKey;
  }

  // ------------------------------------------
  // DESCRIPTION
  // ------------------------------------------

  if (
    projectData.description !==
    undefined
  ) {
    payload.description =
      String(
        projectData.description ||
          "",
      ).trim();
  }

  // ------------------------------------------
  // START DATE
  // ------------------------------------------

  if (
    projectData.start_date !==
    undefined
  ) {
    payload.start_date =
      projectData.start_date ||
      null;
  }

  // ------------------------------------------
  // END DATE
  // ------------------------------------------

  if (
    projectData.end_date !==
    undefined
  ) {
    payload.end_date =
      projectData.end_date ||
      null;
  }

  // ------------------------------------------
  // DATE RANGE VALIDATION
  // ------------------------------------------

  if (
    payload.start_date &&
    payload.end_date &&
    payload.end_date <
      payload.start_date
  ) {
    throw new Error(
      "End date cannot be before start date.",
    );
  }

  // ------------------------------------------
  // STATUS
  // ------------------------------------------

  if (
    projectData.status !==
    undefined
  ) {
    const allowedStatuses = [
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED",
    ];

    const status =
      String(
        projectData.status,
      ).toUpperCase();

    if (
      !allowedStatuses.includes(
        status,
      )
    ) {
      throw new Error(
        "Invalid project status.",
      );
    }

    payload.status = status;
  }

  // ------------------------------------------
  // EMPTY PATCH PROTECTION
  // ------------------------------------------

  if (
    Object.keys(payload).length ===
    0
  ) {
    throw new Error(
      "No project fields were provided for update.",
    );
  }

  return apiRequest(
    `${API_BASE_URL}/projects/${projectId}/`,
    {
      method: "PATCH",

      body: JSON.stringify(
        payload,
      ),
    },
  );
};

// ==========================================================
// 13. DELETE PROJECT
// DELETE /api/projects/{projectId}/
// ==========================================================
//
// Request body:
// none
//
// Success:
// HTTP 204 No Content
//
// There is NO JSON response body.
//
// Permission:
// Only Project ADMIN can delete.
//
// In your backend this currently behaves
// as soft delete:
//
// status -> ARCHIVED
//
// Frontend hides archived projects.
// ==========================================================

export const deleteProject = async (
  projectId,
) => {
  if (!projectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  /*
    apiRequest safely handles
    HTTP 204 No Content.

    It will return {} after a
    successful deletion.
  */

  return apiRequest(
    `${API_BASE_URL}/projects/${projectId}/`,
    {
      method: "DELETE",
    },
  );
};