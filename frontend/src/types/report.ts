export interface ReportRequest {
    entity_id: number;
    entity_type: 'post' | 'comment' | 'user';
    reason_text: string;
}

export interface ReportResponse {
    message: string;
}