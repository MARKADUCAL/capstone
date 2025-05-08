import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';

export interface ApiResponse {
  status: {
    remarks: string;
    message: string;
  };
  payload: {
    token: string;
    user: {
      stud_id_no?: string;
      faculty_id_no?: string;
      fname: string;
      lname: string;
      email: string;
      role: string;
      profile_picture?: string;
    };
  } | null;
  prepared_by: string;
  timestamp: string;
}
