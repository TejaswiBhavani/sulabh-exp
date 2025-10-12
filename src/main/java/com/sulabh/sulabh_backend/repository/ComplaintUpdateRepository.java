package com.sulabh.sulabh_backend.repository;

import com.sulabh.sulabh_backend.entity.Complaint;
import com.sulabh.sulabh_backend.entity.ComplaintUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintUpdateRepository extends JpaRepository<ComplaintUpdate, Long> {
    
    List<ComplaintUpdate> findByComplaintOrderByUpdatedAtDesc(Complaint complaint);
    
    List<ComplaintUpdate> findByComplaintIdOrderByUpdatedAtDesc(Long complaintId);
}