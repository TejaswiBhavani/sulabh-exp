package com.sulabh.sulabh_backend.repository;

import com.sulabh.sulabh_backend.entity.Complaint;
import com.sulabh.sulabh_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    
    List<Complaint> findByUserOrderBySubmittedAtDesc(User user);
    
    Page<Complaint> findByUserOrderBySubmittedAtDesc(User user, Pageable pageable);
    
    List<Complaint> findByStatusOrderBySubmittedAtDesc(Complaint.ComplaintStatus status);
    
    List<Complaint> findByCategoryOrderBySubmittedAtDesc(Complaint.ComplaintCategory category);
    
    List<Complaint> findByPriorityOrderBySubmittedAtDesc(Complaint.Priority priority);
    
    @Query("SELECT c FROM Complaint c WHERE c.user = :user AND c.status = :status ORDER BY c.submittedAt DESC")
    List<Complaint> findByUserAndStatus(@Param("user") User user, @Param("status") Complaint.ComplaintStatus status);
    
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = :status")
    Long countByStatus(@Param("status") Complaint.ComplaintStatus status);
    
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.user = :user")
    Long countByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.user = :user AND c.status = :status")
    Long countByUserAndStatus(@Param("user") User user, @Param("status") Complaint.ComplaintStatus status);
}