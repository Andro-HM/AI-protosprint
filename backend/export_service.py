import csv
import io
from typing import List, Dict
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch


class ExportService:
    @staticmethod
    def generate_habits_csv(habits: List[Dict], completions: List[Dict]) -> str:
        """Generate CSV export of habits with completion statistics."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Habit Name', 'Emoji', 'Status', 'Total Completions', 'Created Date'])
        
        # Data
        for habit in habits:
            habit_completions = [c for c in completions if c['habit_id'] == habit['id']]
            writer.writerow([
                habit['name'],
                habit['emoji'],
                'Active' if habit.get('is_active', True) else 'Inactive',
                len(habit_completions),
                habit.get('created_at', '')[:10]
            ])
        
        return output.getvalue()
    
    @staticmethod
    def generate_journal_csv(entries: List[Dict]) -> str:
        """Generate CSV export of journal entries."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Date', 'Mood', 'Content'])
        
        # Data
        for entry in entries:
            writer.writerow([
                entry.get('entry_date', ''),
                entry.get('mood', ''),
                entry.get('content', '')[:500]  # Truncate long content
            ])
        
        return output.getvalue()
    
    @staticmethod
    def generate_habits_pdf(habits: List[Dict], completions: List[Dict], user_name: str) -> bytes:
        """Generate PDF export of habits."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#059669'),
            spaceAfter=30,
        )
        elements.append(Paragraph(f"Habits Report - {user_name}", title_style))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Table data
        data = [['Habit', 'Status', 'Completions']]
        for habit in habits:
            habit_completions = [c for c in completions if c['habit_id'] == habit['id']]
            data.append([
                f"{habit['emoji']} {habit['name']}",
                'Active' if habit.get('is_active', True) else 'Inactive',
                str(len(habit_completions))
            ])
        
        # Create table
        table = Table(data, colWidths=[3.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        
        elements.append(table)
        doc.build(elements)
        
        return buffer.getvalue()
    
    @staticmethod
    def generate_journal_pdf(entries: List[Dict], user_name: str) -> bytes:
        """Generate PDF export of journal entries."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#8b5cf6'),
            spaceAfter=30,
        )
        elements.append(Paragraph(f"Journal - {user_name}", title_style))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Entries
        for entry in entries:
            # Date and mood
            date_style = ParagraphStyle(
                'DateStyle',
                parent=styles['Heading3'],
                fontSize=14,
                textColor=colors.HexColor('#8b5cf6'),
            )
            elements.append(Paragraph(f"{entry.get('entry_date', '')} - {entry.get('mood', '')}", date_style))
            elements.append(Spacer(1, 0.1*inch))
            
            # Content
            content = entry.get('content', '').replace('\n', '<br/>')
            elements.append(Paragraph(content, styles['Normal']))
            elements.append(Spacer(1, 0.3*inch))
        
        doc.build(elements)
        return buffer.getvalue()


export_service = ExportService()
