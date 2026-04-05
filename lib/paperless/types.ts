export interface PaperlessDocument {
  id: number
  title: string
  content: string
  correspondent: number | null
  document_type: number | null
  storage_path: number | null
  tags: number[]
  created_date: string
  modified: string
  added: string
  archive_serial_number: number | null
  original_file_name: string
}

export interface PaperlessPaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PaperlessTag {
  id: number
  name: string
  slug: string
  color: string
  text_color: string
  match: string
  matching_algorithm: number
}

export interface PaperlessCorrespondent {
  id: number
  name: string
  slug: string
  match: string
  matching_algorithm: number
}

export interface PaperlessDocumentType {
  id: number
  name: string
  slug: string
  match: string
  matching_algorithm: number
}

export interface PaperlessTaskStatus {
  id: number
  task_id: string
  task_file_name: string
  status: "PENDING" | "STARTED" | "SUCCESS" | "FAILURE" | "RETRY"
  result: string | null
  related_document: string | null
}

export interface PaperlessDocumentListParams {
  page?: number
  page_size?: number
  query?: string
  correspondent__id?: number
  tags__id__in?: number[]
  created__date__gt?: string
  created__date__lt?: string
  ordering?: string
}

export interface PaperlessUploadMetadata {
  title?: string
  created?: string
  correspondent?: number
  document_type?: number
  tags?: number[]
  archive_serial_number?: number
}

export class PaperlessApiError extends Error {
  statusCode: number
  statusText: string
  responseBody: string

  constructor(statusCode: number, statusText: string, responseBody: string) {
    super(`Paperless API error ${statusCode}: ${statusText}`)
    this.name = "PaperlessApiError"
    this.statusCode = statusCode
    this.statusText = statusText
    this.responseBody = responseBody
  }
}
