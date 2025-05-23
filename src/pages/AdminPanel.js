import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert, Form, Spinner, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { requestService } from '../services/api';
import { format } from 'date-fns';
import ErrorBoundary from '../components/ErrorBoundary';

const AdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fileFilter, setFileFilter] = useState('All');
  const [sort, setSort] = useState('desc');
  const [stats, setStats] = useState({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    pages: [1]
  });
  
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching requests for page:', page);
      
      const response = await requestService.getAllRequests({
        search,
        status: statusFilter,
        fileFilter,
        sort,
        page
      });
      
      console.log('API Response:', response);
      
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to load requests');
      }
      
      // Calculate proper pagination based on total requests (10 per page)
      let calculatedTotalPages = 1;
      let calculatedPages = [1];
      let totalRequests = 0;
      
      // Create default pagination if not provided by backend
      let paginationData = { total: 0, totalPages: 1, currentPage: 1 };
      
      if (response.data) {
        const { requests: fetchedRequests = [], stats: statsData = {} } = response.data;
        
        // Get total requests count from stats
        totalRequests = statsData.total || fetchedRequests.length;
        
        // Extract pagination data - handle both structures
        if (response.data.pagination) {
          paginationData = response.data.pagination;
        } else if (response.pagination) {
          paginationData = response.pagination;
        }
        
        // Calculate total pages based on total requests (10 per page)
        calculatedTotalPages = Math.ceil(totalRequests / 10);
        
        // Generate page numbers based on calculated total pages
        calculatedPages = Array.from({ length: calculatedTotalPages }, (_, i) => i + 1);
        
        console.log('Total requests:', totalRequests);
        console.log('Calculated total pages:', calculatedTotalPages);
        console.log('Generated pages:', calculatedPages);
        
        setRequests(fetchedRequests);
        setPagination({
          total: totalRequests,
          totalPages: calculatedTotalPages,
          currentPage: paginationData.currentPage || page,
          pages: calculatedPages
        });
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error.message || 'Failed to load requests. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequests();
  }, [search, statusFilter, fileFilter, sort, page]);
  
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await requestService.updateRequestStatus(requestId, newStatus);
      fetchRequests();
    } catch (error) {
      setError('Failed to update status. Please try again.');
    }
  };
  
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSort(newSort);
    setPage(1); // Reset to first page when sorting changes
  };
  
  // Helper to render status badge with appropriate color
  const renderStatusBadge = (status) => {
    const statusMap = {
      'Pending': 'warning',
      'In Progress': 'info',
      'Completed': 'success',
      'Rejected': 'danger'
    };
    
    return <Badge bg={statusMap[status] || 'secondary'}>{status || 'Unknown'}</Badge>;
  };
  
  // Format date with fallback
  const formatDate = (date) => {
    try {
      return date ? format(new Date(date), 'MMM dd, yyyy') : 'No date';
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Render pagination controls
  const renderPagination = () => {
    // Generate page numbers based on stats.total (10 requests per page)
    const totalPages = pagination.totalPages || 1;
    const pages = pagination.pages || [1];
    
    // Don't render pagination if there's only one page or no requests
    if (!requests.length || totalPages <= 1) {
      console.log('No pagination shown: requests length =', requests.length, 'totalPages =', totalPages);
      return null;
    }
    
    console.log('Rendering pagination with pages:', pages);
    
    // Custom styles for pagination with !important to override Bootstrap defaults
    const customPaginationStyle = {
      container: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px'
      },
      ul: {
        display: 'flex',
        padding: 0,
        margin: 0,
        listStyle: 'none'
      },
      item: {
        margin: '0 2px',
        cursor: 'pointer',
        backgroundColor: '#111111',
        color: '#FFF4E2',
        border: '1px solid #647881',
        padding: '6px 12px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none'
      },
      activeItem: {
        margin: '0 2px',
        cursor: 'pointer',
        backgroundColor: '#647881',
        color: '#FFF4E2',
        border: '1px solid #647881',
        padding: '6px 12px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none'
      },
      disabledItem: {
        margin: '0 2px',
        backgroundColor: '#111111',
        color: '#555555',
        border: '1px solid #333333',
        padding: '6px 12px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'not-allowed',
        textDecoration: 'none'
      }
    };
    
    return (
      <div className="mt-4">
        <div style={customPaginationStyle.container}>
          <ul style={customPaginationStyle.ul}>
            {/* Previous Button */}
            <li>
              {page > 1 ? (
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                  style={customPaginationStyle.item}
                >
                  &laquo;
                </a>
              ) : (
                <span style={customPaginationStyle.disabledItem}>&laquo;</span>
              )}
            </li>
            
            {/* Page Numbers */}
            {pages.map(p => (
              <li key={p}>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setPage(p); }}
                  style={p === page ? customPaginationStyle.activeItem : customPaginationStyle.item}
                >
                  {p}
                </a>
              </li>
            ))}
            
            {/* Next Button */}
            <li>
              {page < totalPages ? (
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                  style={customPaginationStyle.item}
                >
                  &raquo;
                </a>
              ) : (
                <span style={customPaginationStyle.disabledItem}>&raquo;</span>
              )}
            </li>
          </ul>
        </div>
        
        <div className="text-center mt-2" style={{ color: '#FFF4E2' }}>
          Page {page} of {totalPages}
        </div>
      </div>
    );
  };
  
  // Render loading skeleton
  const renderSkeleton = () => (
    <tr>
      <td colSpan="6" className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </td>
    </tr>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <tr>
      <td colSpan="6" className="text-center p-5">
        <p className="mb-0" style={{ color: '#647881' }}>
          No requests found. Try adjusting your filters.
        </p>
      </td>
    </tr>
  );
  
  return (
    <Container fluid className="py-4">
      <ErrorBoundary>
        <Card className="shadow-sm" style={{ backgroundColor: '#111111', borderColor: '#647881' }}>
          <Card.Header style={{ backgroundColor: '#000000', borderBottom: '1px solid #647881' }}>
            <h4 className="mb-0" style={{ color: '#FFF4E2' }}>Request Management</h4>
          </Card.Header>
          <Card.Body>
            {/* Stats Row */}
            <Row className="mb-4">
              <Col md={3}>
                <Card style={{ backgroundColor: '#647881', border: 'none' }}>
                  <Card.Body>
                    <h6 style={{ color: '#FFF4E2' }}>Total Requests</h6>
                    <h3 style={{ color: '#FFFFFF' }}>{stats.total || 0}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={{ backgroundColor: '#8B7355', border: 'none' }}>
                  <Card.Body>
                    <h6 style={{ color: '#FFF4E2' }}>Pending</h6>
                    <h3 style={{ color: '#FFFFFF' }}>{stats.pending || 0}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={{ backgroundColor: '#4F94CD', border: 'none' }}>
                  <Card.Body>
                    <h6 style={{ color: '#FFF4E2' }}>In Progress</h6>
                    <h3 style={{ color: '#FFFFFF' }}>{stats.inProgress || 0}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={{ backgroundColor: '#2E8B57', border: 'none' }}>
                  <Card.Body>
                    <h6 style={{ color: '#FFF4E2' }}>Completed</h6>
                    <h3 style={{ color: '#FFFFFF' }}>{stats.completed || 0}</h3>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Search and Filter Controls */}
            <Row className="mb-4 g-3">
              <Col md={3}>
                <Form.Control
                  type="search"
                  placeholder="Search requests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ 
                    backgroundColor: '#222222',
                    color: '#FFFFFF',
                    borderColor: '#647881'
                  }}
                />
              </Col>
              <Col md={2}>
                <Form.Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ 
                    backgroundColor: '#222222',
                    color: '#FFFFFF',
                    borderColor: '#647881'
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select 
                  value={fileFilter} 
                  onChange={(e) => setFileFilter(e.target.value)}
                  style={{ 
                    backgroundColor: '#222222',
                    color: '#FFFFFF',
                    borderColor: '#647881'
                  }}
                >
                  <option value="All">All Files</option>
                  <option value="Missing Files">Missing Files</option>
                  <option value="Only Completed">With Files</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select 
                  value={sort} 
                  onChange={handleSortChange}
                  style={{ 
                    backgroundColor: '#222222',
                    color: '#FFFFFF',
                    borderColor: '#647881'
                  }}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </Form.Select>
              </Col>
            </Row>
            
            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}
            
            {/* Requests Table */}
            <div className="table-responsive">
              <Table variant="dark" hover className="align-middle">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Title</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Files</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    renderSkeleton()
                  ) : requests.length === 0 ? (
                    renderEmptyState()
                  ) : (
                    requests.map(request => (
                      <tr key={request._id}>
                        <td>{request._id}</td>
                        <td>{request.title || 'Untitled Request'}</td>
                        <td>{request.user?.name || 'Unknown User'}</td>
                        <td>{renderStatusBadge(request.status)}</td>
                        <td>
                          <Badge bg={request.model ? 'success' : 'warning'}>
                            {request.model ? 'Uploaded' : 'Missing'}
                          </Badge>
                        </td>
                        <td>{formatDate(request.createdAt)}</td>
                        <td>
                          <Link 
                            to={`/admin/requests/${request._id}`}
                            className="btn btn-sm btn-outline-info"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            
            {renderPagination()}
          </Card.Body>
        </Card>
      </ErrorBoundary>
    </Container>
  );
};

export default AdminPanel; 