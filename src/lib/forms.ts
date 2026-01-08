import { google } from "googleapis";

export interface Form {
  id: string;
  title: string;
  description?: string;
  documentTitle?: string;
  responderUri?: string;
  linkedSheetId?: string;
  items?: FormItem[];
}

export interface FormItem {
  itemId: string;
  title: string;
  description?: string;
  questionItem?: {
    question: {
      questionId: string;
      required?: boolean;
      textQuestion?: { paragraph?: boolean };
      choiceQuestion?: {
        type: "RADIO" | "CHECKBOX" | "DROP_DOWN";
        options: { value: string }[];
      };
      scaleQuestion?: {
        low: number;
        high: number;
        lowLabel?: string;
        highLabel?: string;
      };
      dateQuestion?: { includeTime?: boolean };
      timeQuestion?: boolean;
    };
  };
  pageBreakItem?: object;
  textItem?: object;
  imageItem?: { image: { sourceUri?: string; altText?: string } };
  videoItem?: { video: { youtubeUri?: string } };
}

export interface FormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers: {
    [questionId: string]: {
      questionId: string;
      textAnswers?: { answers: { value: string }[] };
    };
  };
}

function getFormsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.forms({ version: "v1", auth });
}

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export async function listForms(
  accessToken: string,
  options: {
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<{ forms: { id: string; name: string; modifiedTime?: string }[]; nextPageToken?: string }> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.form' and trashed = false",
    pageToken: options.pageToken,
    pageSize: options.pageSize || 50,
    orderBy: "modifiedTime desc",
    fields: "nextPageToken, files(id, name, modifiedTime)",
  });

  const forms = (response.data.files || []).map((file) => ({
    id: file.id || "",
    name: file.name || "",
    modifiedTime: file.modifiedTime ?? undefined,
  }));

  return {
    forms,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

export async function getForm(
  accessToken: string,
  formId: string
): Promise<Form> {
  const forms = getFormsClient(accessToken);

  const response = await forms.forms.get({
    formId,
  });

  const data = response.data;
  return {
    id: data.formId || "",
    title: data.info?.title || "",
    description: data.info?.description ?? undefined,
    documentTitle: data.info?.documentTitle ?? undefined,
    responderUri: data.responderUri ?? undefined,
    linkedSheetId: data.linkedSheetId ?? undefined,
    items: data.items?.map((item) => ({
      itemId: item.itemId || "",
      title: item.title || "",
      description: item.description ?? undefined,
      questionItem: item.questionItem
        ? {
            question: {
              questionId: item.questionItem.question?.questionId || "",
              required: item.questionItem.question?.required ?? undefined,
              textQuestion: item.questionItem.question?.textQuestion
                ? { paragraph: item.questionItem.question.textQuestion.paragraph ?? undefined }
                : undefined,
              choiceQuestion: item.questionItem.question?.choiceQuestion
                ? {
                    type: item.questionItem.question.choiceQuestion.type as "RADIO" | "CHECKBOX" | "DROP_DOWN",
                    options: item.questionItem.question.choiceQuestion.options?.map((o) => ({
                      value: o.value || "",
                    })) || [],
                  }
                : undefined,
              scaleQuestion: item.questionItem.question?.scaleQuestion
                ? {
                    low: item.questionItem.question.scaleQuestion.low || 1,
                    high: item.questionItem.question.scaleQuestion.high || 5,
                    lowLabel: item.questionItem.question.scaleQuestion.lowLabel ?? undefined,
                    highLabel: item.questionItem.question.scaleQuestion.highLabel ?? undefined,
                  }
                : undefined,
              dateQuestion: item.questionItem.question?.dateQuestion
                ? { includeTime: item.questionItem.question.dateQuestion.includeTime ?? undefined }
                : undefined,
              timeQuestion: item.questionItem.question?.timeQuestion ? true : undefined,
            },
          }
        : undefined,
      pageBreakItem: item.pageBreakItem ?? undefined,
      textItem: item.textItem ?? undefined,
      imageItem: item.imageItem
        ? { image: { sourceUri: item.imageItem.image?.sourceUri ?? undefined, altText: item.imageItem.image?.altText ?? undefined } }
        : undefined,
      videoItem: item.videoItem
        ? { video: { youtubeUri: item.videoItem.video?.youtubeUri ?? undefined } }
        : undefined,
    })),
  };
}

export async function createForm(
  accessToken: string,
  title: string,
  documentTitle?: string
): Promise<Form> {
  const forms = getFormsClient(accessToken);

  const response = await forms.forms.create({
    requestBody: {
      info: {
        title,
        documentTitle: documentTitle || title,
      },
    },
  });

  const data = response.data;
  return {
    id: data.formId || "",
    title: data.info?.title || title,
    documentTitle: data.info?.documentTitle ?? undefined,
    responderUri: data.responderUri ?? undefined,
  };
}

export async function updateForm(
  accessToken: string,
  formId: string,
  updates: {
    title?: string;
    description?: string;
  }
): Promise<void> {
  const forms = getFormsClient(accessToken);

  const requests: { updateFormInfo: { info: { title?: string; description?: string }; updateMask: string } }[] = [];

  if (updates.title !== undefined || updates.description !== undefined) {
    const updateMasks: string[] = [];
    const info: { title?: string; description?: string } = {};

    if (updates.title !== undefined) {
      info.title = updates.title;
      updateMasks.push("title");
    }
    if (updates.description !== undefined) {
      info.description = updates.description;
      updateMasks.push("description");
    }

    requests.push({
      updateFormInfo: {
        info,
        updateMask: updateMasks.join(","),
      },
    });
  }

  if (requests.length > 0) {
    await forms.forms.batchUpdate({
      formId,
      requestBody: { requests },
    });
  }
}

export async function addFormQuestion(
  accessToken: string,
  formId: string,
  question: {
    title: string;
    description?: string;
    required?: boolean;
    type: "SHORT_TEXT" | "PARAGRAPH" | "MULTIPLE_CHOICE" | "CHECKBOXES" | "DROPDOWN" | "SCALE" | "DATE" | "TIME";
    options?: string[];
    scaleConfig?: { low: number; high: number; lowLabel?: string; highLabel?: string };
  },
  index?: number
): Promise<void> {
  const forms = getFormsClient(accessToken);

  let questionConfig: {
    required?: boolean;
    textQuestion?: { paragraph: boolean };
    choiceQuestion?: { type: string; options: { value: string }[] };
    scaleQuestion?: { low: number; high: number; lowLabel?: string; highLabel?: string };
    dateQuestion?: { includeTime: boolean };
    timeQuestion?: object;
  } = { required: question.required };

  switch (question.type) {
    case "SHORT_TEXT":
      questionConfig.textQuestion = { paragraph: false };
      break;
    case "PARAGRAPH":
      questionConfig.textQuestion = { paragraph: true };
      break;
    case "MULTIPLE_CHOICE":
      questionConfig.choiceQuestion = {
        type: "RADIO",
        options: (question.options || []).map((value) => ({ value })),
      };
      break;
    case "CHECKBOXES":
      questionConfig.choiceQuestion = {
        type: "CHECKBOX",
        options: (question.options || []).map((value) => ({ value })),
      };
      break;
    case "DROPDOWN":
      questionConfig.choiceQuestion = {
        type: "DROP_DOWN",
        options: (question.options || []).map((value) => ({ value })),
      };
      break;
    case "SCALE":
      questionConfig.scaleQuestion = {
        low: question.scaleConfig?.low || 1,
        high: question.scaleConfig?.high || 5,
        lowLabel: question.scaleConfig?.lowLabel,
        highLabel: question.scaleConfig?.highLabel,
      };
      break;
    case "DATE":
      questionConfig.dateQuestion = { includeTime: false };
      break;
    case "TIME":
      questionConfig.timeQuestion = {};
      break;
  }

  await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          createItem: {
            item: {
              title: question.title,
              description: question.description,
              questionItem: {
                question: questionConfig,
              },
            },
            location: { index: index ?? 0 },
          },
        },
      ],
    },
  });
}

export async function getFormResponses(
  accessToken: string,
  formId: string,
  options: {
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<{ responses: FormResponse[]; nextPageToken?: string }> {
  const forms = getFormsClient(accessToken);

  const response = await forms.forms.responses.list({
    formId,
    pageToken: options.pageToken,
    pageSize: options.pageSize || 100,
  });

  const responses = (response.data.responses || []).map((r) => ({
    responseId: r.responseId || "",
    createTime: r.createTime || "",
    lastSubmittedTime: r.lastSubmittedTime || "",
    respondentEmail: r.respondentEmail ?? undefined,
    answers: Object.fromEntries(
      Object.entries(r.answers || {}).map(([questionId, answer]) => [
        questionId,
        {
          questionId: answer.questionId || "",
          textAnswers: answer.textAnswers
            ? { answers: answer.textAnswers.answers?.map((a) => ({ value: a.value || "" })) || [] }
            : undefined,
        },
      ])
    ),
  }));

  return {
    responses,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

export async function getFormResponse(
  accessToken: string,
  formId: string,
  responseId: string
): Promise<FormResponse> {
  const forms = getFormsClient(accessToken);

  const response = await forms.forms.responses.get({
    formId,
    responseId,
  });

  const r = response.data;
  return {
    responseId: r.responseId || "",
    createTime: r.createTime || "",
    lastSubmittedTime: r.lastSubmittedTime || "",
    respondentEmail: r.respondentEmail ?? undefined,
    answers: Object.fromEntries(
      Object.entries(r.answers || {}).map(([questionId, answer]) => [
        questionId,
        {
          questionId: answer.questionId || "",
          textAnswers: answer.textAnswers
            ? { answers: answer.textAnswers.answers?.map((a) => ({ value: a.value || "" })) || [] }
            : undefined,
        },
      ])
    ),
  };
}
